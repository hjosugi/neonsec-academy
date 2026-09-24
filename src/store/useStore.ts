// ============================================================
// NeonSec Academy — central persisted store (Zustand).
// Persists only user-generated data; the seed bank stays static.
// ============================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Attempt,
  AttemptConfidence,
  AttemptMode,
  DrillResult,
  EngagementProgress,
  EvidenceItem,
  IncidentWorkspace,
  ExamSession,
  ExamResult,
  FlagAttempt,
  FlagHintUse,
  Grade,
  LabWorksheet,
  MistakeNote,
  PracticalAnswer,
  PracticalResult,
  PracticalSession,
  PortfolioProfile,
  Profile,
  Question,
  RawQuestion,
  Report,
  ReviewItem,
  ReviewSessionSummary,
  Settings,
  Severity,
  FindingStatus,
  TriageFinding,
  TrackSubmission,
  ThreatModelWork,
} from '../types'
import { SEED_QUESTIONS, enrichQuestion } from '../data/questions'
import { LABS, labById } from '../data/labs'
import { XP } from '../data/taxonomy'
import { DAY, dayKey, startOfDay } from '../lib/format'
import { uid } from '../lib/id'
import { autoGrade, newReviewItem, scheduleNext } from '../lib/srs'
import { isCorrect } from '../lib/grade'
import { moduleStats, domainStats } from '../lib/analytics'
import { computeDerivedBadges } from '../lib/badges'
import { gradeExam } from '../lib/exam'
import { gradePracticalSession } from '../lib/practicalSim'
import { ENGAGEMENTS } from '../data/tracks/engagement'
import { engagementReport, engagementStatus, normalizeEngagementProgress } from '../lib/engagement'
import { TRACK_CHALLENGES, trackChallengeById } from '../data/tracks'
import { TRACKS } from '../data/taxonomy'
import { normalizeTrackSubmissions, trackQuestionId, type TrackDraft } from '../lib/trackChallenges'
import type { TrackChallenge } from '../data/tracks/types'
import { INCIDENTS } from '../data/tracks/incidents'
import { blankIncidentWorkspace, importSocTimelines, normalizeIncidentWorkspaces } from '../lib/incidentResponse'
import { THREAT_MODEL_SCENARIOS } from '../data/tracks/threatModel'
import { normalizeThreatModelWork, threatModelReport } from '../lib/threatModel'
import {
  normalizeEvidenceItem,
  normalizeEvidenceItems,
  reconcileReportEvidenceLinks,
} from '../lib/evidence'
import { citeEvidenceInReport, createLabReport, findLabReport } from '../lib/labReport'
import { normalizeLabWorksheets, worksheetStatus, worksheetToFinding } from '../lib/webConcept'
import {
  addTriageFindingToReport,
  normalizeTriageFindings,
  rubricSeverity,
  transitionStatus,
  validateTriageFinding,
} from '../lib/triage'
import {
  flagHintUsesForChallenge,
  isFlagChallengeSolved,
  isFlagCorrect,
  normalizeFlagAttempts,
  normalizeFlagHintUses,
  sanitizeFlagSubmission,
} from '../lib/flagChallenge'

const SCHEMA_VERSION = 1

const defaultProfile: Profile = {
  xp: 0,
  streakDays: 0,
  lastActiveDay: null,
  badges: [],
  createdAt: Date.now(),
  examTargetPct: 85,
  onboarded: false,
  studyGoal: 'all',
  targetDate: null,
  safetyAcknowledged: false,
  useSeedBank: true,
}

const defaultSettings: Settings = {
  reduceMotion: false,
  lowGlow: false,
  highContrast: false,
  scanlines: true,
  sound: false,
  dailyGoal: 20,
  reviewDailyLimit: 20,
  coverageThresholdPct: 80,
  minModuleQuestionCount: 10,
  readinessRequiredMocks: 3,
  readinessMaxDueBacklog: 0,
  readinessWeakModuleMasteryPct: 70,
  readinessMaxWeakModules: 0,
  askConfidence: true,
  achievementsEnabled: true,
  labPassingScore: 80,
  labHintPenalty: 2,
  labScopeWarningPenalty: 5,
}

// ---- Active question list (seed + user overrides − archived) ----
export function buildQuestionCatalog(userQuestions: RawQuestion[]): Question[] {
  const map = new Map<string, Question>()
  for (const q of SEED_QUESTIONS) map.set(q.id, q)
  for (const raw of userQuestions) {
    const e = enrichQuestion({ ...raw, source: 'user' })
    if (e) map.set(e.id, e)
  }
  return [...map.values()]
}

export function buildActiveQuestions(
  userQuestions: RawQuestion[],
  archivedIds: string[],
): Question[] {
  const archived = new Set(archivedIds)
  return buildQuestionCatalog(userQuestions).filter((q) => !archived.has(q.id) && q.status !== 'archived')
}

function withActivity(
  profile: Profile,
  attemptsAfter: Attempt[],
  now: number,
  baseXp: number,
  dailyGoal: number,
): Profile {
  const today = dayKey(now)
  let streakDays: number
  let lastActiveDay: string
  if (profile.lastActiveDay === today) {
    streakDays = profile.streakDays || 1
    lastActiveDay = today
  } else {
    const yesterday = dayKey(now - DAY)
    streakDays = profile.lastActiveDay === yesterday ? profile.streakDays + 1 : 1
    lastActiveDay = today
  }
  let xp = profile.xp + baseXp
  const todays = attemptsAfter.reduce((n, a) => n + (dayKey(a.at) === today ? 1 : 0), 0)
  if (todays === dailyGoal) xp += XP.dailyGoalMet
  return { ...profile, xp, streakDays, lastActiveDay }
}

function normalizePortfolio(value: unknown): PortfolioProfile | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  return {
    displayName: typeof row.displayName === 'string' ? row.displayName.slice(0, 80) : '',
    reflection: typeof row.reflection === 'string' ? row.reflection.slice(0, 8000) : '',
    updatedAt: typeof row.updatedAt === 'number' && row.updatedAt > 0 ? row.updatedAt : 0,
  }
}

/** Maps a track submission onto finding fields (learner writing first, model answer as fallback). */
function trackFindingFields(challenge: TrackChallenge, submission: TrackSubmission) {
  const text = (keys: string[]) => {
    for (const key of keys) {
      const value = submission.writeups[key]?.trim()
      if (value) return value
    }
    const model = challenge.writeups.find((item) => keys.includes(item.key))
    return model?.model ?? ''
  }
  const lines = submission.selectedLines.map((line) => `L${line}: ${challenge.artifact.lines[line - 1]?.trim() ?? ''}`)
  return {
    asset: challenge.artifact.label,
    impact: text(['impact', 'risk', 'indicator', 'affected-asset']),
    remediation: text(['fix', 'remediation', 'next-action']) || challenge.remediation,
    evidence: [`${challenge.artifact.label} (synthetic)`, ...lines].join('\n'),
  }
}

// ============================================================
interface AppState {
  version: number
  profile: Profile
  settings: Settings
  attempts: Attempt[]
  reviews: Record<string, ReviewItem>
  mistakes: Record<string, MistakeNote>
  bookmarks: string[]
  pinNotes: Record<string, string>
  reviewSummaries: ReviewSessionSummary[]
  drillResults: DrillResult[]
  archivedIds: string[]
  userQuestions: RawQuestion[]
  examResults: ExamResult[]
  activeExam: ExamSession | null
  flagAttempts: FlagAttempt[]
  flagHintUses: FlagHintUse[]
  evidenceItems: EvidenceItem[]
  reports: Report[]
  labWorksheets: LabWorksheet[]
  triageFindings: TriageFinding[]
  activePractical: PracticalSession | null
  practicalResults: PracticalResult[]
  engagementProgress: Record<string, EngagementProgress>
  trackSubmissions: TrackSubmission[]
  incidentWorkspaces: Record<string, IncidentWorkspace>
  threatModels: Record<string, ThreatModelWork>
  portfolio: PortfolioProfile
}

interface AppActions {
  // answering
  recordAttempt: (
    questionId: string,
    chosen: string | string[] | null,
    correct: boolean,
    mode: AttemptMode,
    timeMs?: number,
    confidence?: AttemptConfidence,
    reasoningGap?: string,
  ) => void
  gradeReview: (
    questionId: string,
    grade: Grade,
    correct: boolean,
    chosen?: string | string[] | null,
    timeMs?: number,
    confidence?: AttemptConfidence,
    reasoningGap?: string,
  ) => void
  rescheduleReview: (questionId: string, dueAt: number) => void
  // bookmarks + mistakes
  toggleBookmark: (questionId: string) => void
  updatePinNote: (questionId: string, note: string) => void
  saveReviewSummary: (summary: ReviewSessionSummary) => void
  saveDrillResult: (result: DrillResult) => void
  upsertMistake: (questionId: string, patch: Partial<MistakeNote>) => void
  deleteMistake: (questionId: string) => void
  toggleMistakeResolved: (questionId: string) => void
  // authoring
  upsertUserQuestion: (q: RawQuestion) => void
  deleteUserQuestion: (id: string) => void
  archiveQuestion: (id: string) => void
  unarchiveQuestion: (id: string) => void
  // exam
  startExam: (session: ExamSession) => void
  examAnswer: (questionId: string, chosen: string | string[] | null) => void
  examToggleFlag: (questionId: string) => void
  examSetConfidence: (questionId: string, confidence: AttemptConfidence | null) => void
  examAddTime: (questionId: string, timeMs: number) => void
  examGoto: (index: number) => void
  cancelExam: () => void
  submitExam: () => ExamResult | null
  // practical simulator
  startPractical: (session: PracticalSession) => void
  practicalAnswer: (questionId: string, patch: Partial<PracticalAnswer>) => void
  practicalGoto: (index: number) => void
  cancelPractical: () => void
  submitPractical: () => PracticalResult | null
  // pentest engagement workflow
  saveEngagementProgress: (progress: EngagementProgress) => void
  /** Creates or refreshes the engagement report from triage decisions; returns its id. */
  generateEngagementReport: (scenarioId: string) => string | null
  resetEngagement: (scenarioId: string) => void
  // CEH+ track challenges
  submitTrackChallenge: (challengeId: string, draft: TrackDraft) => TrackSubmission | null
  /** Creates a triage finding from the latest submission; returns the triage id. */
  sendTrackChallengeToTriage: (challengeId: string) => string | null
  /** Adds the latest submission as a finding in the track's review report; returns the report id. */
  addTrackChallengeToReport: (challengeId: string) => string | null
  // incident response
  saveIncidentWorkspace: (workspace: IncidentWorkspace) => void
  /** Imports the learner's SOC-track timelines for the incident's related challenges; returns events added. */
  importSocTimelinesToIncident: (incidentId: string) => number
  resetIncident: (incidentId: string) => void
  // threat modeling
  saveThreatModel: (work: ThreatModelWork) => void
  /** Sends the remediation backlog to the Report Builder; returns the report id. */
  threatModelToReport: (scenarioId: string) => string | null
  // portfolio
  savePortfolio: (patch: Partial<Omit<PortfolioProfile, 'updatedAt'>>) => void
  // flag challenges
  submitLabFlag: (challengeId: string, submitted: string) => FlagAttempt | null
  revealLabFlagHint: (challengeId: string, hintIndex: number) => boolean
  // evidence + reports
  upsertEvidence: (item: EvidenceItem) => void
  /** Saves evidence and cites it in the lab's report, creating the report when needed. */
  sendEvidenceToLabReport: (item: EvidenceItem, findingId?: string) => string | null
  deleteEvidence: (id: string) => void
  upsertReport: (report: Report) => void
  saveLabWorksheet: (worksheet: Omit<LabWorksheet, 'updatedAt'>) => void
  /** Adds a complete worksheet to the lab report as a finding; returns the report id. */
  addWorksheetToReport: (labId: string, severity: Severity) => string | null
  // vulnerability triage
  upsertTriageFinding: (finding: TriageFinding) => boolean
  deleteTriageFinding: (id: string) => void
  setTriageStatus: (id: string, to: FindingStatus, note: string) => boolean
  /** Imports a lab's model findings as open triage items; returns how many were added. */
  importLabFindingsToTriage: (labId: string) => number
  /** Copies a triage finding into a report (null = new report); returns the report id. */
  addTriageToReport: (findingId: string, reportId: string | null) => string | null
  deleteReport: (id: string) => void
  // profile / settings
  updateSettings: (patch: Partial<Settings>) => void
  updateProfile: (patch: Partial<Profile>) => void
  completeOnboarding: () => void
  awardBadge: (id: string) => void
  refreshBadges: () => void
  // data mgmt
  resetProgress: () => void
  exportData: () => string
  importData: (json: string) => boolean
}

export type Store = AppState & AppActions

export function mergePersistedStoreState(persistedState: unknown, currentState: Store): Store {
  if (!persistedState || typeof persistedState !== 'object' || Array.isArray(persistedState)) {
    return currentState
  }
  const persisted = persistedState as Partial<AppState>
  const flagAttempts = Array.isArray(persisted.flagAttempts)
    ? normalizeFlagAttempts(persisted.flagAttempts, LABS)
    : currentState.flagAttempts
  const flagHintUses = Array.isArray(persisted.flagHintUses)
    ? normalizeFlagHintUses(persisted.flagHintUses, LABS)
    : currentState.flagHintUses
  const evidenceItems = Array.isArray(persisted.evidenceItems)
    ? normalizeEvidenceItems(persisted.evidenceItems)
    : currentState.evidenceItems
  const reports = reconcileReportEvidenceLinks(
    Array.isArray(persisted.reports) ? persisted.reports : currentState.reports,
    evidenceItems,
  )
  const labWorksheets = Array.isArray(persisted.labWorksheets)
    ? normalizeLabWorksheets(persisted.labWorksheets, LABS)
    : currentState.labWorksheets
  const triageFindings = Array.isArray(persisted.triageFindings)
    ? normalizeTriageFindings(persisted.triageFindings)
    : currentState.triageFindings
  const trackSubmissions = Array.isArray(persisted.trackSubmissions)
    ? normalizeTrackSubmissions(persisted.trackSubmissions, TRACK_CHALLENGES)
    : currentState.trackSubmissions
  const incidentWorkspaces = persisted.incidentWorkspaces !== undefined
    ? normalizeIncidentWorkspaces(persisted.incidentWorkspaces, INCIDENTS)
    : currentState.incidentWorkspaces
  const threatModels = persisted.threatModels !== undefined
    ? normalizeThreatModelWork(persisted.threatModels, THREAT_MODEL_SCENARIOS)
    : currentState.threatModels
  const engagementProgress = persisted.engagementProgress !== undefined
    ? normalizeEngagementProgress(persisted.engagementProgress, ENGAGEMENTS)
    : currentState.engagementProgress
  return {
    ...currentState,
    ...persisted,
    flagAttempts,
    flagHintUses,
    evidenceItems,
    reports,
    labWorksheets,
    triageFindings,
    engagementProgress,
    trackSubmissions,
    incidentWorkspaces,
    threatModels,
    portfolio: normalizePortfolio(persisted.portfolio) ?? currentState.portfolio,
  }
}

const initialState: AppState = {
  version: SCHEMA_VERSION,
  profile: defaultProfile,
  settings: defaultSettings,
  attempts: [],
  reviews: {},
  mistakes: {},
  bookmarks: [],
  pinNotes: {},
  reviewSummaries: [],
  drillResults: [],
  archivedIds: [],
  userQuestions: [],
  examResults: [],
  activeExam: null,
  flagAttempts: [],
  flagHintUses: [],
  evidenceItems: [],
  reports: [],
  labWorksheets: [],
  triageFindings: [],
  activePractical: null,
  practicalResults: [],
  engagementProgress: {},
  trackSubmissions: [],
  incidentWorkspaces: {},
  threatModels: {},
  portfolio: { displayName: '', reflection: '', updatedAt: 0 },
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      recordAttempt: (questionId, chosen, correct, mode, timeMs, confidence, reasoningGap) => {
        const now = Date.now()
        set((s) => {
          const attempt: Attempt = {
            id: uid('a-'),
            questionId,
            at: now,
            correct,
            chosen,
            mode,
            timeMs,
            confidence,
            reasoningGap: reasoningGap?.trim() || undefined,
          }
          const attempts = [...s.attempts, attempt]
          const reviews = { ...s.reviews }
          const existing = reviews[questionId] ?? newReviewItem(questionId, now)
          reviews[questionId] = scheduleNext(existing, autoGrade(correct, confidence), now, confidence)
          const baseXp = correct ? XP.answerCorrect : XP.answerWrong
          const profile = withActivity(s.profile, attempts, now, baseXp, s.settings.dailyGoal)
          return { attempts, reviews, profile }
        })
        get().refreshBadges()
      },

      gradeReview: (questionId, grade, correct, chosen = null, timeMs, confidence, reasoningGap) => {
        const now = Date.now()
        set((s) => {
          const attempt: Attempt = {
            id: uid('a-'),
            questionId,
            at: now,
            correct,
            chosen,
            mode: 'review',
            timeMs,
            confidence,
            reasoningGap: reasoningGap?.trim() || undefined,
          }
          const attempts = [...s.attempts, attempt]
          const reviews = { ...s.reviews }
          const existing = reviews[questionId] ?? newReviewItem(questionId, now)
          reviews[questionId] = scheduleNext(existing, grade, now, confidence)
          const profile = withActivity(s.profile, attempts, now, XP.reviewDone, s.settings.dailyGoal)
          return { attempts, reviews, profile }
        })
        get().refreshBadges()
      },

      rescheduleReview: (questionId, dueAt) =>
        set((s) => {
          const now = Date.now()
          const existing = s.reviews[questionId] ?? newReviewItem(questionId, now)
          return {
            reviews: {
              ...s.reviews,
              [questionId]: {
                ...existing,
                dueAt: startOfDay(dueAt),
                suspended: false,
              },
            },
          }
        }),

      toggleBookmark: (questionId) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(questionId)
            ? s.bookmarks.filter((id) => id !== questionId)
            : [...s.bookmarks, questionId],
        })),

      updatePinNote: (questionId, note) =>
        set((s) => {
          const clean = note.trim()
          const pinNotes = { ...s.pinNotes }
          if (clean) pinNotes[questionId] = clean
          else delete pinNotes[questionId]
          return {
            pinNotes,
            bookmarks: clean && !s.bookmarks.includes(questionId) ? [...s.bookmarks, questionId] : s.bookmarks,
          }
        }),

      saveReviewSummary: (summary) =>
        set((s) => ({
          reviewSummaries: [
            summary,
            ...s.reviewSummaries.filter((item) => item.id !== summary.id),
          ].slice(0, 30),
        })),

      saveDrillResult: (result) =>
        set((s) => ({
          drillResults: [
            result,
            ...s.drillResults.filter((item) => item.id !== result.id),
          ].slice(0, 50),
        })),

      upsertMistake: (questionId, patch) =>
        set((s) => {
          const now = Date.now()
          const prev = s.mistakes[questionId]
          const defaults: MistakeNote = {
            questionId,
            whyWrong: '',
            correctReasoning: '',
            trapPattern: '',
            memoryPhrase: '',
            nextAction: '',
            resolved: false,
            createdAt: prev?.createdAt ?? now,
            updatedAt: now,
          }
          const note: MistakeNote = { ...defaults, ...(prev ?? {}), ...patch, questionId, updatedAt: now }
          return { mistakes: { ...s.mistakes, [questionId]: note } }
        }),

      deleteMistake: (questionId) =>
        set((s) => {
          const mistakes = { ...s.mistakes }
          delete mistakes[questionId]
          return { mistakes }
        }),

      toggleMistakeResolved: (questionId) =>
        set((s) => {
          const m = s.mistakes[questionId]
          if (!m) return {}
          return {
            mistakes: {
              ...s.mistakes,
              [questionId]: { ...m, resolved: !m.resolved, updatedAt: Date.now() },
            },
          }
        }),

      upsertUserQuestion: (q) =>
        set((s) => {
          const now = Date.now()
          const idx = s.userQuestions.findIndex((x) => x.id === q.id)
          const userQuestions = [...s.userQuestions]
          const prev = idx >= 0 ? userQuestions[idx] : undefined
          const next: RawQuestion = {
            ...q,
            source: 'user',
            status: q.status ?? 'active',
            createdAt: q.createdAt ?? prev?.createdAt ?? now,
            updatedAt: now,
          }
          if (idx >= 0) userQuestions[idx] = next
          else userQuestions.push(next)
          return { userQuestions }
        }),

      deleteUserQuestion: (id) =>
        set((s) => ({
          userQuestions: s.userQuestions.filter((q) => q.id !== id),
          archivedIds: s.archivedIds.filter((x) => x !== id),
        })),

      archiveQuestion: (id) =>
        set((s) => ({
          archivedIds: s.archivedIds.includes(id) ? s.archivedIds : [...s.archivedIds, id],
        })),

      unarchiveQuestion: (id) =>
        set((s) => ({ archivedIds: s.archivedIds.filter((x) => x !== id) })),

      startExam: (session) => set({ activeExam: session }),

      examAnswer: (questionId, chosen) =>
        set((s) => {
          if (!s.activeExam) return {}
          const prev = s.activeExam.answers[questionId] ?? { chosen: null, flagged: false }
          return {
            activeExam: {
              ...s.activeExam,
              answers: { ...s.activeExam.answers, [questionId]: { ...prev, chosen } },
            },
          }
        }),

      examToggleFlag: (questionId) =>
        set((s) => {
          if (!s.activeExam) return {}
          const prev = s.activeExam.answers[questionId] ?? { chosen: null, flagged: false }
          return {
            activeExam: {
              ...s.activeExam,
              answers: {
                ...s.activeExam.answers,
                [questionId]: { ...prev, flagged: !prev.flagged },
              },
            },
          }
        }),

      examSetConfidence: (questionId, confidence) =>
        set((s) => {
          if (!s.activeExam) return {}
          const prev = s.activeExam.answers[questionId] ?? { chosen: null, flagged: false }
          return {
            activeExam: {
              ...s.activeExam,
              answers: {
                ...s.activeExam.answers,
                [questionId]: { ...prev, confidence },
              },
            },
          }
        }),

      examAddTime: (questionId, timeMs) =>
        set((s) => {
          if (!s.activeExam || timeMs <= 0) return {}
          const prev = s.activeExam.answers[questionId] ?? { chosen: null, flagged: false }
          return {
            activeExam: {
              ...s.activeExam,
              answers: {
                ...s.activeExam.answers,
                [questionId]: { ...prev, timeMs: (prev.timeMs ?? 0) + timeMs },
              },
            },
          }
        }),

      examGoto: (index) =>
        set((s) => {
          if (!s.activeExam) return {}
          const clamped = Math.max(0, Math.min(index, s.activeExam.questionIds.length - 1))
          return { activeExam: { ...s.activeExam, currentIndex: clamped } }
        }),

      cancelExam: () => set({ activeExam: null }),

      submitExam: () => {
        const s = get()
        const session = s.activeExam
        if (!session) return null
        const now = Date.now()
        const ended: ExamSession = { ...session, endedAt: now, status: 'submitted' }
        const questions = buildActiveQuestions(s.userQuestions, s.archivedIds)
        const result = gradeExam(ended, questions, s.profile.examTargetPct)

        set((st) => {
          const qById = new Map(questions.map((q) => [q.id, q]))
          const attempts = [...st.attempts]
          const reviews = { ...st.reviews }
          for (const qid of session.questionIds) {
            const q = qById.get(qid)
            if (!q) continue
            const answer = session.answers[qid]
            const chosen = answer?.chosen ?? null
            const hasAnswer = chosen != null && !(Array.isArray(chosen) && chosen.length === 0)
            if (!hasAnswer) continue
            const correct = isCorrect(q, chosen)
            attempts.push({
              id: uid('a-'),
              questionId: qid,
              at: now,
              correct,
              chosen,
              mode: 'exam',
              timeMs: answer?.timeMs,
              confidence: answer?.confidence ?? undefined,
            })
            const existing = reviews[qid] ?? newReviewItem(qid, now)
            reviews[qid] = scheduleNext(existing, autoGrade(correct, answer?.confidence ?? undefined), now, answer?.confidence ?? undefined)
          }
          const baseXp = XP.mockComplete + (result.passed ? XP.mockPass : 0)
          const profile = withActivity(st.profile, attempts, now, baseXp, st.settings.dailyGoal)
          return {
            attempts,
            reviews,
            examResults: [...st.examResults, result],
            activeExam: null,
            profile,
          }
        })
        get().refreshBadges()
        return result
      },

      startPractical: (session) => set({ activePractical: session }),

      practicalAnswer: (questionId, patch) =>
        set((s) => {
          if (!s.activePractical || !s.activePractical.questionIds.includes(questionId)) return {}
          const previous = s.activePractical.answers[questionId] ?? { chosen: null }
          return {
            activePractical: {
              ...s.activePractical,
              answers: { ...s.activePractical.answers, [questionId]: { ...previous, ...patch } },
            },
          }
        }),

      practicalGoto: (index) =>
        set((s) => {
          if (!s.activePractical) return {}
          const clamped = Math.max(0, Math.min(index, s.activePractical.questionIds.length - 1))
          return { activePractical: { ...s.activePractical, currentIndex: clamped } }
        }),

      cancelPractical: () => set({ activePractical: null }),

      submitPractical: () => {
        const s = get()
        const session = s.activePractical
        if (!session) return null
        const now = Date.now()
        const questions = buildQuestionCatalog(s.userQuestions)
        const result = gradePracticalSession(session, questions, now)
        const wrong = new Set(result.wrongIds)
        const weak = new Set(result.weakIds)

        set((st) => {
          const attempts = [...st.attempts]
          const reviews = { ...st.reviews }
          for (const questionId of session.questionIds) {
            const answer = session.answers[questionId]
            const correct = !wrong.has(questionId)
            const confidence: AttemptConfidence = weak.has(questionId) ? 2 : correct ? 4 : 2
            attempts.push({
              id: uid('a-'),
              questionId,
              at: now,
              correct,
              chosen: answer?.chosen ?? null,
              mode: 'practical',
              confidence,
            })
            // Wrong and unsure challenges are scheduled early so they land in the Review Queue.
            const existing = reviews[questionId] ?? newReviewItem(questionId, now)
            reviews[questionId] = scheduleNext(existing, autoGrade(correct, confidence), now, confidence)
          }
          const profile = withActivity(st.profile, attempts, now, XP.mockComplete + (result.passed ? XP.mockPass : 0), st.settings.dailyGoal)
          return {
            attempts,
            reviews,
            profile,
            activePractical: null,
            practicalResults: [result, ...st.practicalResults].slice(0, 30),
          }
        })
        get().refreshBadges()
        return result
      },

      saveEngagementProgress: (progress) =>
        set((s) => {
          const scenario = ENGAGEMENTS.find((item) => item.id === progress.scenarioId)
          if (!scenario) return {}
          const now = Date.now()
          const normalized = normalizeEngagementProgress({ [scenario.id]: { ...progress, updatedAt: now } }, ENGAGEMENTS)[scenario.id]
          if (!normalized) return {}
          const complete = engagementStatus(scenario, normalized).complete
          normalized.completedAt = complete ? normalized.completedAt ?? now : undefined
          return { engagementProgress: { ...s.engagementProgress, [scenario.id]: normalized } }
        }),

      generateEngagementReport: (scenarioId) => {
        const scenario = ENGAGEMENTS.find((item) => item.id === scenarioId)
        const progress = get().engagementProgress[scenarioId]
        if (!scenario || !progress) return null
        const existing = progress.reportId ? get().reports.find((report) => report.id === progress.reportId) : undefined
        const report = engagementReport(scenario, { ...progress, reportId: existing?.id }, Date.now())
        get().upsertReport(existing ? { ...report, createdAt: existing.createdAt } : report)
        get().saveEngagementProgress({ ...progress, reportId: report.id })
        return report.id
      },

      resetEngagement: (scenarioId) =>
        set((s) => {
          const engagementProgress = { ...s.engagementProgress }
          delete engagementProgress[scenarioId]
          return { engagementProgress }
        }),

      submitTrackChallenge: (challengeId, draft) => {
        const challenge = trackChallengeById(challengeId)
        if (!challenge) return null
        const now = Date.now()
        const [submission] = normalizeTrackSubmissions([{ ...draft, id: uid('ts-'), challengeId, at: now }], TRACK_CHALLENGES)
        if (!submission) return null
        const questionId = trackQuestionId(challenge)
        set((s) => {
          const attempts = [...s.attempts, {
            id: uid('a-'),
            questionId,
            at: now,
            correct: submission.correct,
            chosen: submission.classification || null,
            mode: 'practical' as const,
          }]
          const reviews = { ...s.reviews }
          const existing = reviews[questionId] ?? newReviewItem(questionId, now)
          // Missed challenges are scheduled like a failed review so they surface in the Review Queue.
          reviews[questionId] = scheduleNext(existing, autoGrade(submission.correct), now)
          const profile = withActivity(s.profile, attempts, now, submission.correct ? XP.answerCorrect * 2 : XP.answerWrong, s.settings.dailyGoal)
          return { trackSubmissions: [...s.trackSubmissions, submission], attempts, reviews, profile }
        })
        get().refreshBadges()
        return submission
      },

      sendTrackChallengeToTriage: (challengeId) => {
        const challenge = trackChallengeById(challengeId)
        const submission = [...get().trackSubmissions].reverse().find((item) => item.challengeId === challengeId)
        if (!challenge || !submission) return null
        const finding = trackFindingFields(challenge, submission)
        const now = Date.now()
        const triage: TriageFinding = {
          id: uid('tf-'),
          title: challenge.title,
          asset: finding.asset,
          evidence: finding.evidence,
          evidenceIds: [],
          impact: finding.impact,
          impactRating: 'significant',
          likelihood: 'possible',
          severity: rubricSeverity('significant', 'possible'),
          severityMode: 'rubric',
          remediation: finding.remediation,
          status: submission.correct ? 'confirmed' : 'open',
          history: [],
          createdAt: now,
          updatedAt: now,
        }
        return get().upsertTriageFinding(triage) ? triage.id : null
      },

      addTrackChallengeToReport: (challengeId) => {
        const challenge = trackChallengeById(challengeId)
        const state = get()
        const submission = [...state.trackSubmissions].reverse().find((item) => item.challengeId === challengeId)
        if (!challenge || !submission) return null
        const title = `${TRACKS[challenge.track].name} review report`
        const now = Date.now()
        const existing = state.reports.find((report) => report.title === title)
        const base: Report = existing ?? {
          id: uid('r-'),
          title,
          scope: `Synthetic ${TRACKS[challenge.track].short} track challenges (fictional artifacts only).`,
          summary: '',
          methodology: 'Static review of synthetic artifacts inside NeonSec Academy: select the relevant lines, classify the issue, and write impact and remediation.',
          findings: [],
          createdAt: now,
          updatedAt: now,
        }
        const fields = trackFindingFields(challenge, submission)
        const finding = {
          id: uid('f-'),
          title: challenge.title,
          severity: 'medium' as const,
          impact: fields.impact,
          remediation: fields.remediation,
          evidence: fields.evidence,
          evidenceIds: [],
          asset: fields.asset,
        }
        const report: Report = {
          ...base,
          findings: [...base.findings.filter((item) => item.title !== challenge.title), finding],
          updatedAt: now,
        }
        state.upsertReport(report)
        return report.id
      },

      saveIncidentWorkspace: (workspace) =>
        set((s) => {
          const normalized = normalizeIncidentWorkspaces({ [workspace.incidentId]: { ...workspace, updatedAt: Date.now() } }, INCIDENTS)[workspace.incidentId]
          return normalized ? { incidentWorkspaces: { ...s.incidentWorkspaces, [workspace.incidentId]: normalized } } : {}
        }),

      importSocTimelinesToIncident: (incidentId) => {
        const incident = INCIDENTS.find((item) => item.id === incidentId)
        if (!incident) return 0
        const state = get()
        const current = state.incidentWorkspaces[incidentId] ?? blankIncidentWorkspace(incident)
        const { workspace, added } = importSocTimelines(current, incident, TRACK_CHALLENGES, state.trackSubmissions)
        if (added > 0) state.saveIncidentWorkspace(workspace)
        return added
      },

      resetIncident: (incidentId) =>
        set((s) => {
          const incidentWorkspaces = { ...s.incidentWorkspaces }
          delete incidentWorkspaces[incidentId]
          return { incidentWorkspaces }
        }),

      saveThreatModel: (work) =>
        set((s) => {
          const normalized = normalizeThreatModelWork({ [work.scenarioId]: { ...work, updatedAt: Date.now() } }, THREAT_MODEL_SCENARIOS)[work.scenarioId]
          return normalized ? { threatModels: { ...s.threatModels, [work.scenarioId]: normalized } } : {}
        }),

      threatModelToReport: (scenarioId) => {
        const scenario = THREAT_MODEL_SCENARIOS.find((item) => item.id === scenarioId)
        const work = get().threatModels[scenarioId]
        if (!scenario || !work) return null
        const existing = work.reportId ? get().reports.find((report) => report.id === work.reportId) : undefined
        const report = threatModelReport(scenario, { ...work, reportId: existing?.id })
        if (report.findings.length === 0) return null
        get().upsertReport(existing ? { ...report, createdAt: existing.createdAt } : report)
        get().saveThreatModel({ ...work, reportId: report.id })
        return report.id
      },

      savePortfolio: (patch) =>
        set((s) => ({
          portfolio: {
            displayName: (patch.displayName ?? s.portfolio.displayName).slice(0, 80),
            reflection: (patch.reflection ?? s.portfolio.reflection).slice(0, 8000),
            updatedAt: Date.now(),
          },
        })),

      submitLabFlag: (challengeId, submitted) => {
        const lab = labById(challengeId)
        const clean = sanitizeFlagSubmission(submitted)
        const state = get()
        if (!lab || !clean || isFlagChallengeSolved(state.flagAttempts, challengeId)) return null

        const attempt: FlagAttempt = {
          id: uid('fa-'),
          challengeId,
          submitted: clean,
          correct: isFlagCorrect(lab.flagChallenge, clean),
          hintCount: flagHintUsesForChallenge(state.flagHintUses, challengeId).length,
          at: Date.now(),
        }
        set((s) => ({ flagAttempts: [...s.flagAttempts, attempt] }))
        return attempt
      },

      revealLabFlagHint: (challengeId, hintIndex) => {
        const lab = labById(challengeId)
        if (!lab || !Number.isInteger(hintIndex) || hintIndex < 0 || hintIndex >= lab.flagChallenge.hints.length) {
          return false
        }
        const state = get()
        if (isFlagChallengeSolved(state.flagAttempts, challengeId)) return false
        if (state.flagHintUses.some((use) => use.challengeId === challengeId && use.hintIndex === hintIndex)) {
          return false
        }
        const hintUse: FlagHintUse = { challengeId, hintIndex, usedAt: Date.now() }
        set((s) => ({ flagHintUses: [...s.flagHintUses, hintUse] }))
        return true
      },

      upsertEvidence: (item) =>
        set((s) => {
          const index = s.evidenceItems.findIndex((existing) => existing.id === item.id)
          const previous = index >= 0 ? s.evidenceItems[index] : undefined
          const now = Date.now()
          const normalized = normalizeEvidenceItem({
            ...item,
            challengeId: previous?.challengeId ?? item.challengeId,
            createdAt: previous?.createdAt ?? item.createdAt ?? now,
            updatedAt: now,
          })
          if (!normalized) return {}

          const evidenceItems = [...s.evidenceItems]
          if (index >= 0) evidenceItems[index] = normalized
          else evidenceItems.unshift(normalized)
          evidenceItems.sort((a, b) => b.timestamp - a.timestamp)
          return { evidenceItems }
        }),

      sendEvidenceToLabReport: (item, findingId) => {
        const lab = labById(item.challengeId)
        const evidence = normalizeEvidenceItem(item)
        if (!lab || !evidence) return null
        get().upsertEvidence(evidence)
        const state = get()
        if (!state.evidenceItems.some((existing) => existing.id === evidence.id)) return null
        const now = Date.now()
        const existing = findLabReport(state.reports, lab)
        const base = existing ? { ...existing, challengeId: existing.challengeId ?? lab.id } : createLabReport(lab, now)
        const cited = citeEvidenceInReport(base, evidence.id, findingId, now)
        state.upsertReport(cited)
        return cited.id
      },

      deleteEvidence: (id) =>
        set((s) => {
          const now = Date.now()
          const reports = s.reports.map((report) => {
            let changed = false
            const findings = report.findings.map((finding) => {
              const evidenceIds = (finding.evidenceIds ?? []).filter((evidenceId) => evidenceId !== id)
              if (evidenceIds.length === (finding.evidenceIds ?? []).length) return finding
              changed = true
              return { ...finding, evidenceIds }
            })
            return changed ? { ...report, findings, updatedAt: now } : report
          })
          return {
            evidenceItems: s.evidenceItems.filter((item) => item.id !== id),
            reports,
          }
        }),

      upsertReport: (report) =>
        set((s) => {
          const idx = s.reports.findIndex((r) => r.id === report.id)
          const reports = [...s.reports]
          const normalized = reconcileReportEvidenceLinks([report], s.evidenceItems)[0]
          if (idx >= 0) reports[idx] = normalized
          else reports.unshift(normalized)
          return { reports }
        }),

      deleteReport: (id) => set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),

      saveLabWorksheet: (worksheet) =>
        set((s) => {
          const normalized = normalizeLabWorksheets([{ ...worksheet, updatedAt: Date.now() }], LABS)[0]
          if (!normalized) return {}
          return { labWorksheets: [normalized, ...s.labWorksheets.filter((item) => item.labId !== normalized.labId)] }
        }),

      upsertTriageFinding: (finding) => {
        const now = Date.now()
        const previous = get().triageFindings.find((item) => item.id === finding.id)
        const [normalized] = normalizeTriageFindings([{
          ...finding,
          createdAt: previous?.createdAt ?? finding.createdAt ?? now,
          updatedAt: now,
        }])
        if (!normalized || !validateTriageFinding(normalized).ok) return false
        set((s) => ({ triageFindings: [normalized, ...s.triageFindings.filter((item) => item.id !== normalized.id)] }))
        return true
      },

      deleteTriageFinding: (id) => set((s) => ({ triageFindings: s.triageFindings.filter((item) => item.id !== id) })),

      setTriageStatus: (id, to, note) => {
        const finding = get().triageFindings.find((item) => item.id === id)
        if (!finding) return false
        const next = transitionStatus(finding, to, note)
        if (!next) return false
        set((s) => ({ triageFindings: s.triageFindings.map((item) => (item.id === id ? next : item)) }))
        return true
      },

      importLabFindingsToTriage: (labId) => {
        const lab = labById(labId)
        if (!lab) return 0
        const existing = get().triageFindings
        const now = Date.now()
        const added: TriageFinding[] = lab.modelFindings
          .filter((model) => !existing.some((item) => item.sourceLabId === lab.id && item.title === model.title))
          .map((model, index) => {
            const impactRating = model.severity === 'critical' ? 'severe' : model.severity === 'high' ? 'significant' : model.severity === 'medium' ? 'moderate' : 'minimal'
            const likelihood = model.severity === 'critical' || model.severity === 'high' ? 'likely' : 'possible'
            return {
              id: uid('tf-'),
              title: model.title,
              asset: `${lab.evidenceTitle} (${lab.category} lab)`,
              evidence: `Synthetic lab evidence: ${lab.evidenceTitle}. ${lab.flagChallenge.explanation}`,
              evidenceIds: [],
              impact: model.impact,
              impactRating,
              likelihood,
              severity: model.severity,
              severityMode: rubricSeverity(impactRating, likelihood) === model.severity ? 'rubric' : 'manual',
              remediation: model.remediation,
              status: 'open',
              sourceLabId: lab.id,
              history: [],
              createdAt: now + index,
              updatedAt: now + index,
            }
          })
        if (added.length > 0) set((s) => ({ triageFindings: [...added, ...s.triageFindings] }))
        return added.length
      },

      addTriageToReport: (findingId, reportId) => {
        const state = get()
        const finding = state.triageFindings.find((item) => item.id === findingId)
        if (!finding || !validateTriageFinding(finding).ok) return null
        const now = Date.now()
        const target = reportId ? state.reports.find((report) => report.id === reportId) : undefined
        if (reportId && !target) return null
        const base: Report = target ?? {
          id: uid('r-'),
          title: 'Vulnerability triage report',
          scope: 'Synthetic findings triaged in NeonSec Academy. No real systems were tested.',
          summary: '',
          findings: [],
          createdAt: now,
          updatedAt: now,
        }
        const report = addTriageFindingToReport(base, finding, now)
        state.upsertReport(report)
        return report.id
      },

      addWorksheetToReport: (labId, severity) => {
        const lab = labById(labId)
        const state = get()
        const worksheet = state.labWorksheets.find((item) => item.labId === labId)
        if (!lab || !worksheet || !worksheetStatus(worksheet).complete) return null
        const now = Date.now()
        const existing = findLabReport(state.reports, lab)
        const base = existing ? { ...existing, challengeId: existing.challengeId ?? lab.id } : { ...createLabReport(lab, now), findings: [] }
        const report: Report = { ...base, findings: [...base.findings, worksheetToFinding(worksheet, lab, severity)], updatedAt: now }
        state.upsertReport(report)
        return report.id
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      completeOnboarding: () => set((s) => ({ profile: { ...s.profile, onboarded: true } })),

      awardBadge: (id) =>
        set((s) =>
          s.settings.achievementsEnabled === false || s.profile.badges.includes(id)
            ? {}
            : { profile: { ...s.profile, badges: [...s.profile.badges, id] } },
        ),

      refreshBadges: () =>
        set((s) => {
          if (s.settings.achievementsEnabled === false) return {}
          const questions = buildActiveQuestions(s.userQuestions, s.archivedIds)
          const mods = moduleStats(questions, s.attempts, s.reviews, Date.now())
          const domains = domainStats(mods)
          const derived = computeDerivedBadges({
            mods,
            domains,
            attemptsCount: s.attempts.length,
            results: s.examResults,
            streakDays: s.profile.streakDays,
          })
          const merged = Array.from(new Set([...s.profile.badges, ...derived]))
          if (merged.length === s.profile.badges.length) return {}
          return { profile: { ...s.profile, badges: merged } }
        }),

      resetProgress: () =>
        set((s) => ({
          attempts: [],
          reviews: {},
          mistakes: {},
          bookmarks: [],
          pinNotes: {},
          reviewSummaries: [],
          drillResults: [],
          examResults: [],
          activeExam: null,
          activePractical: null,
          practicalResults: [],
          trackSubmissions: [],
          engagementProgress: {},
          flagAttempts: [],
          flagHintUses: [],
          profile: {
            ...defaultProfile,
            createdAt: s.profile.createdAt,
            examTargetPct: s.profile.examTargetPct,
            onboarded: s.profile.onboarded,
          },
        })),

      exportData: () => {
        const s = get()
        const payload = {
          version: SCHEMA_VERSION,
          exportedAt: Date.now(),
          profile: s.profile,
          settings: s.settings,
          attempts: s.attempts,
          reviews: s.reviews,
          mistakes: s.mistakes,
          bookmarks: s.bookmarks,
          pinNotes: s.pinNotes,
          reviewSummaries: s.reviewSummaries,
          drillResults: s.drillResults,
          archivedIds: s.archivedIds,
          userQuestions: s.userQuestions,
          examResults: s.examResults,
          flagAttempts: s.flagAttempts,
          flagHintUses: s.flagHintUses,
          evidenceItems: s.evidenceItems,
          reports: s.reports,
          labWorksheets: s.labWorksheets,
          triageFindings: s.triageFindings,
          practicalResults: s.practicalResults,
          engagementProgress: s.engagementProgress,
          trackSubmissions: s.trackSubmissions,
          incidentWorkspaces: s.incidentWorkspaces,
          threatModels: s.threatModels,
          portfolio: s.portfolio,
        }
        return JSON.stringify(payload, null, 2)
      },

      importData: (json) => {
        try {
          const d = JSON.parse(json)
          if (typeof d !== 'object' || d === null) return false
          set((s) => {
            const flagAttempts = Array.isArray(d.flagAttempts)
              ? normalizeFlagAttempts(d.flagAttempts, LABS)
              : s.flagAttempts
            const flagHintUses = Array.isArray(d.flagHintUses)
              ? normalizeFlagHintUses(d.flagHintUses, LABS)
              : s.flagHintUses
            const evidenceItems = Array.isArray(d.evidenceItems)
              ? normalizeEvidenceItems(d.evidenceItems)
              : s.evidenceItems
            const reports = reconcileReportEvidenceLinks(
              Array.isArray(d.reports) ? d.reports : s.reports,
              evidenceItems,
            )
            const labWorksheets = Array.isArray(d.labWorksheets)
              ? normalizeLabWorksheets(d.labWorksheets, LABS)
              : s.labWorksheets
            const triageFindings = Array.isArray(d.triageFindings)
              ? normalizeTriageFindings(d.triageFindings)
              : s.triageFindings
            return {
              profile: { ...defaultProfile, ...(d.profile ?? {}) },
              settings: { ...defaultSettings, ...(d.settings ?? {}) },
              attempts: Array.isArray(d.attempts) ? d.attempts : s.attempts,
              reviews: d.reviews ?? s.reviews,
              mistakes: d.mistakes ?? s.mistakes,
              bookmarks: Array.isArray(d.bookmarks) ? d.bookmarks : s.bookmarks,
              pinNotes: d.pinNotes && typeof d.pinNotes === 'object' ? d.pinNotes : s.pinNotes,
              reviewSummaries: Array.isArray(d.reviewSummaries) ? d.reviewSummaries : s.reviewSummaries,
              drillResults: Array.isArray(d.drillResults) ? d.drillResults : s.drillResults,
              archivedIds: Array.isArray(d.archivedIds) ? d.archivedIds : s.archivedIds,
              userQuestions: Array.isArray(d.userQuestions) ? d.userQuestions : s.userQuestions,
              examResults: Array.isArray(d.examResults) ? d.examResults : s.examResults,
              flagAttempts,
              flagHintUses,
              evidenceItems,
              reports,
              labWorksheets,
              triageFindings,
              practicalResults: Array.isArray(d.practicalResults) ? d.practicalResults : s.practicalResults,
              engagementProgress: d.engagementProgress !== undefined
                ? normalizeEngagementProgress(d.engagementProgress, ENGAGEMENTS)
                : s.engagementProgress,
              trackSubmissions: Array.isArray(d.trackSubmissions)
                ? normalizeTrackSubmissions(d.trackSubmissions, TRACK_CHALLENGES)
                : s.trackSubmissions,
              incidentWorkspaces: d.incidentWorkspaces !== undefined
                ? normalizeIncidentWorkspaces(d.incidentWorkspaces, INCIDENTS)
                : s.incidentWorkspaces,
              threatModels: d.threatModels !== undefined
                ? normalizeThreatModelWork(d.threatModels, THREAT_MODEL_SCENARIOS)
                : s.threatModels,
              portfolio: normalizePortfolio(d.portfolio) ?? s.portfolio,
            }
          })
          return true
        } catch {
          return false
        }
      },
    }),
    {
      name: 'neonsec-academy:v1',
      version: SCHEMA_VERSION,
      partialize: (s) => ({
        version: s.version,
        profile: s.profile,
        settings: s.settings,
        attempts: s.attempts,
        reviews: s.reviews,
        mistakes: s.mistakes,
        bookmarks: s.bookmarks,
        pinNotes: s.pinNotes,
        reviewSummaries: s.reviewSummaries,
        drillResults: s.drillResults,
        archivedIds: s.archivedIds,
        userQuestions: s.userQuestions,
        examResults: s.examResults,
        activeExam: s.activeExam,
        flagAttempts: s.flagAttempts,
        flagHintUses: s.flagHintUses,
        evidenceItems: s.evidenceItems,
        reports: s.reports,
        labWorksheets: s.labWorksheets,
        triageFindings: s.triageFindings,
        activePractical: s.activePractical,
        practicalResults: s.practicalResults,
        engagementProgress: s.engagementProgress,
        trackSubmissions: s.trackSubmissions,
        incidentWorkspaces: s.incidentWorkspaces,
        threatModels: s.threatModels,
        portfolio: s.portfolio,
      }),
      merge: mergePersistedStoreState,
    },
  ),
)
