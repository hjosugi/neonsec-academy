import type {
  Attempt,
  EvidenceItem,
  ExamSession,
  FlagAttempt,
  MistakeNote,
  Question,
  Report,
  ReviewItem,
  TriageFinding,
} from '../types'
import { LABS } from '../data/labs'
import { DAY } from './format'
import { gradeExam } from './exam'
import { isGradable } from './grade'
import { newReviewItem, scheduleNext } from './srs'
import { citeEvidenceInReport, createLabReport, evidenceFromLabLines } from './labReport'
import { generateExecutiveSummary, generateRemediationPlan } from './reportQuality'
import { rubricSeverity } from './triage'

// ============================================================
// Demo dataset (P6-010). Deterministic, 100% synthetic progress that shows
// the dashboard, review queue, mock exam report, lab report, and city map
// without touching the learner's own data. Built from the shipped seed
// questions and labs so every id resolves.
// ============================================================

export const DEMO_BACKUP_KEY = 'neonsec-academy:pre-demo-backup'
export const DEMO_MARKER = 'neonsec-demo-dataset'
export const DEMO_EXAM_SESSION_ID = 'demo-exam-2'
export const DEMO_REPORT_ID = 'demo-report-1'

/** Mulberry32 PRNG so the demo is identical on every load. */
function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Per-domain accuracy so the demo shows clear strengths and weak districts. */
const DOMAIN_ACCURACY: Record<string, number> = {
  overview: 0.9,
  recon: 0.82,
  system: 0.74,
  network: 0.7,
  web: 0.55,
  wireless: 0.6,
  'mobile-iot': 0.66,
  cloud: 0.78,
  crypto: 0.62,
  beyond: 0.68,
}

function wrongChoice(question: Question, random: () => number): string {
  const choices = (question.choices ?? []).filter((choice) => choice !== question.answer)
  return choices[Math.floor(random() * choices.length)] ?? 'unknown'
}

export interface DemoDataset {
  marker: typeof DEMO_MARKER
  payload: Record<string, unknown>
  examSessionIds: string[]
  labReportId: string
}

export function buildDemoDataset(questions: Question[], now = Date.now()): DemoDataset {
  const random = rng(20260925)
  const gradable = questions.filter((question) => isGradable(question) && question.type === 'mcq')
  const byModule = new Map<number, Question[]>()
  for (const question of gradable) byModule.set(question.module, [...(byModule.get(question.module) ?? []), question])

  // ---- attempts + review schedule over the last 14 days ----
  const attempts: Attempt[] = []
  const reviews: Record<string, ReviewItem> = {}
  const picked: Question[] = []
  for (const [, list] of [...byModule.entries()].sort((a, b) => a[0] - b[0])) picked.push(...list.slice(0, 7))
  picked.forEach((question, index) => {
    const at = now - (14 - (index % 14)) * DAY + (index % 9) * 3_600_000
    const correct = random() < (DOMAIN_ACCURACY[question.domain] ?? 0.7)
    attempts.push({
      id: `demo-a-${index}`,
      questionId: question.id,
      at,
      correct,
      chosen: correct ? String(question.answer) : wrongChoice(question, random),
      mode: index % 5 === 0 ? 'drill' : 'practice',
      timeMs: 25_000 + Math.floor(random() * 60_000),
      confidence: correct ? 4 : 2,
    })
    const item = scheduleNext(newReviewItem(question.id, at), correct ? 'good' : 'again', at, correct ? 4 : 2)
    // Pull a handful of items forward so the Review Queue has due work today.
    reviews[question.id] = index % 6 === 0 ? { ...item, dueAt: now - DAY } : item
  })

  // ---- mistake notes for two misses ----
  const misses = attempts.filter((attempt) => !attempt.correct).slice(0, 2)
  const mistakes: Record<string, MistakeNote> = Object.fromEntries(misses.map((attempt) => [attempt.questionId, {
    questionId: attempt.questionId,
    whyWrong: 'Picked the option that sounded most technical instead of reading the scenario constraint.',
    correctReasoning: 'The scenario asks for the control that prevents the issue, not the one that detects it.',
    trapPattern: 'Detection vs prevention',
    memoryPhrase: 'Prevent first, detect second.',
    nextAction: 'Redo this module drill tomorrow.',
    createdAt: attempt.at,
    updatedAt: attempt.at,
    resolved: false,
  }]))

  // ---- two mock exams ----
  const examQuestions = gradable.filter((question) => question.module >= 1).slice(0, 400)
  const examSessionIds: string[] = []
  const examResults = [0.72, 0.84].map((target, examIndex) => {
    const ids: string[] = []
    for (let i = 0; ids.length < 25 && i < examQuestions.length; i++) {
      const question = examQuestions[(i * 13 + examIndex * 7) % examQuestions.length]
      if (!ids.includes(question.id)) ids.push(question.id)
    }
    const answers: ExamSession['answers'] = {}
    ids.forEach((id, index) => {
      const question = examQuestions.find((item) => item.id === id)!
      const correct = index < Math.round(ids.length * target)
      answers[id] = { chosen: correct ? String(question.answer) : wrongChoice(question, random), flagged: index % 9 === 0, confidence: correct ? 4 : 2, timeMs: 70_000 }
    })
    const startedAt = now - (6 - examIndex * 4) * DAY
    const session: ExamSession = {
      id: `demo-exam-${examIndex + 1}`,
      createdAt: startedAt,
      preset: 'quick',
      presetLabel: 'Quick Sim',
      questionIds: ids,
      answers,
      durationSec: 45 * 60,
      startedAt,
      endedAt: startedAt + 38 * 60_000,
      currentIndex: 0,
      status: 'submitted',
    }
    examSessionIds.push(session.id)
    return { ...gradeExam(session, questions, 85), submittedAt: session.endedAt! }
  })

  // ---- Safe Lab: solved flag, captured evidence, cited report, triage ----
  const lab = LABS.find((item) => item.id === 'soc-bruteforce')!
  const labAt = now - 2 * DAY
  const flagAttempts: FlagAttempt[] = [
    { id: 'demo-fa-1', challengeId: lab.id, submitted: 'FLAG{BRUTE_FORCE}', correct: false, hintCount: 0, at: labAt },
    { id: 'demo-fa-2', challengeId: lab.id, submitted: lab.flagChallenge.expectedFlag, correct: true, hintCount: 1, at: labAt + 600_000 },
  ]
  const evidence: EvidenceItem = { ...evidenceFromLabLines(lab, [8, 9], labAt)!, id: 'demo-ev-1' }
  const base = createLabReport(lab, labAt)
  const drafted = { ...base, id: DEMO_REPORT_ID, findings: base.findings.map((finding, index) => ({ ...finding, id: `demo-f-${index}`, evidence: 'auth.log (synthetic) L8-L9: success without MFA, then bulk export.' })) }
  const cited = citeEvidenceInReport(drafted, evidence.id, drafted.findings[0].id, labAt)
  const report: Report = {
    ...cited,
    summary: generateExecutiveSummary(cited),
    remediationPlan: generateRemediationPlan(cited),
  }
  const triage: TriageFinding = {
    id: 'demo-tf-1',
    title: lab.modelFindings[0].title,
    asset: 'auth.log (synthetic) — fictional SSO tenant',
    evidence: evidence.note,
    evidenceIds: [evidence.id],
    impact: lab.modelFindings[0].impact,
    impactRating: 'significant',
    likelihood: 'likely',
    severity: rubricSeverity('significant', 'likely'),
    severityMode: 'rubric',
    remediation: lab.modelFindings[0].remediation,
    status: 'confirmed',
    sourceLabId: lab.id,
    history: [{ from: 'open', to: 'confirmed', note: '', at: labAt + 900_000 }],
    createdAt: labAt + 800_000,
    updatedAt: labAt + 900_000,
  }

  return {
    marker: DEMO_MARKER,
    examSessionIds,
    labReportId: report.id,
    payload: {
      version: 1,
      exportedAt: now,
      demo: DEMO_MARKER,
      profile: {
        xp: 2_450,
        streakDays: 6,
        lastActiveDay: new Date(now).toISOString().slice(0, 10),
        badges: ['first-contact', 'scope-keeper'],
        createdAt: now - 20 * DAY,
        examTargetPct: 85,
        onboarded: true,
        studyGoal: 'ceh-exam',
        targetDate: new Date(now + 30 * DAY).toISOString().slice(0, 10),
        safetyAcknowledged: true,
        useSeedBank: true,
      },
      attempts,
      reviews,
      mistakes,
      bookmarks: picked.slice(0, 3).map((question) => question.id),
      pinNotes: {},
      reviewSummaries: [],
      drillResults: [],
      archivedIds: [],
      userQuestions: [],
      examResults,
      flagAttempts,
      flagHintUses: [{ challengeId: lab.id, hintIndex: 0, usedAt: labAt + 300_000 }],
      evidenceItems: [evidence],
      reports: [report],
      labWorksheets: [],
      triageFindings: [triage],
      practicalResults: [],
      engagementProgress: {},
      trackSubmissions: [],
      incidentWorkspaces: {},
      threatModels: {},
      portfolio: { displayName: 'demo-learner', reflection: 'Demo reflection: triage before reporting, cite every claim.', updatedAt: now },
      interviewStories: [],
      labPacks: [],
    },
  }
}
