import type { TrackChallenge } from '../data/tracks/types'
import type { Lab } from '../data/labs'
import type {
  DomainId,
  DomainStat,
  FlagAttempt,
  InterviewStory,
  ModuleStat,
  Report,
  TrackKey,
  TrackSubmission,
} from '../types'
import { DOMAINS, TRACKS } from '../data/taxonomy'
import { latestSubmissions } from './trackChallenges'
import { uid } from './id'

// ============================================================
// Security Interview Readiness Tracker (P5-008): skill evidence from
// concepts, labs, reports, and track work; STAR / concise stories; honest
// gaps with a next plan; short spoken-answer memos.
// ============================================================

export type SkillStatus = 'strong' | 'developing' | 'gap'

export interface SkillEvidence {
  id: string
  name: string
  kind: 'ceh-domain' | 'ceh-plus'
  status: SkillStatus
  /** Concept evidence from question attempts (0-100), or null when unattempted. */
  conceptAccuracyPct: number | null
  conceptAttempts: number
  labs: string[]
  reports: string[]
  challengesSolved: number
  challengesTotal: number
  weakModules: Array<{ module: number; moduleName: string; masteryPct: number }>
  nextPlan: string[]
}

/** Which labs demonstrate which skill (domain or CEH+ track). */
const LAB_SKILLS: Record<string, string[]> = {
  'soc-bruteforce': ['system', 'soc', 'ir'],
  'cloud-iam': ['cloud'],
  'web-idor': ['web', 'appsec'],
  'web-input-validation': ['web', 'appsec'],
  'web-session-rotation': ['web', 'network'],
  'web-security-headers': ['web', 'appsec'],
  'net-cleartext': ['network'],
  'phish-headers': ['network', 'soc'],
  'web-log-forced-browsing': ['web', 'soc'],
  'fw-rule-shadowing': ['network', 'pentest'],
  'threat-model': ['threat-model'],
}

const SKILL_DOMAINS: DomainId[] = ['overview', 'recon', 'system', 'network', 'web', 'wireless', 'mobile-iot', 'cloud', 'crypto']
const TRACK_KEYS = Object.keys(TRACKS) as TrackKey[]

export interface InterviewInput {
  domains: DomainStat[]
  modules: ModuleStat[]
  labs: Lab[]
  flagAttempts: FlagAttempt[]
  reports: Report[]
  trackChallenges: TrackChallenge[]
  trackSubmissions: TrackSubmission[]
  /** Accuracy per CEH+ track from module-0 question attempts. */
  trackAccuracy: Partial<Record<TrackKey, { attempts: number; accuracyPct: number }>>
}

function status(accuracy: number | null, evidenceCount: number): SkillStatus {
  if (accuracy !== null && accuracy >= 75 && evidenceCount > 0) return 'strong'
  if ((accuracy !== null && accuracy >= 60) || evidenceCount > 0) return 'developing'
  return 'gap'
}

export function skillEvidence(input: InterviewInput): SkillEvidence[] {
  const solvedLabs = new Set(input.flagAttempts.filter((attempt) => attempt.correct).map((attempt) => attempt.challengeId))
  const latest = latestSubmissions(input.trackSubmissions)
  const labsFor = (skill: string) => input.labs.filter((lab) => solvedLabs.has(lab.id) && (LAB_SKILLS[lab.id] ?? []).includes(skill))
  const reportsFor = (labIds: string[]) => input.reports.filter((report) => report.challengeId && labIds.includes(report.challengeId)).map((report) => report.title)

  const domainSkills = SKILL_DOMAINS.map((domainId): SkillEvidence => {
    const domain = input.domains.find((item) => item.domainId === domainId)
    const accuracy = domain && domain.attempts > 0 ? Math.round(domain.accuracy * 100) : null
    const labs = labsFor(domainId)
    const skillLabIds = input.labs.filter((lab) => (LAB_SKILLS[lab.id] ?? []).includes(domainId)).map((lab) => lab.id)
    const reports = reportsFor(skillLabIds)
    const weakModules = input.modules
      .filter((module) => module.domain === domainId && module.mastery < 0.7)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3)
      .map((module) => ({ module: module.module, moduleName: module.moduleName, masteryPct: Math.round(module.mastery * 100) }))
    const skillStatus = status(accuracy, labs.length + reports.length)
    const nextPlan = [
      ...weakModules.map((module) => `Drill M${module.module} ${module.moduleName} until mastery passes 70% (now ${module.masteryPct}%).`),
      ...(labs.length === 0 && skillLabIds.length > 0 ? [`Solve a related Safe Lab (${input.labs.find((lab) => lab.id === skillLabIds[0])?.title ?? skillLabIds[0]}) and write its report.`] : []),
    ]
    return {
      id: domainId,
      name: DOMAINS[domainId].name,
      kind: 'ceh-domain',
      status: skillStatus,
      conceptAccuracyPct: accuracy,
      conceptAttempts: domain?.attempts ?? 0,
      labs: labs.map((lab) => lab.title),
      reports,
      challengesSolved: 0,
      challengesTotal: 0,
      weakModules,
      nextPlan: nextPlan.length > 0 ? nextPlan : ['Keep the skill fresh with a weekly review session.'],
    }
  })

  const trackSkills = TRACK_KEYS.map((track): SkillEvidence => {
    const challenges = input.trackChallenges.filter((challenge) => challenge.track === track)
    const solved = challenges.filter((challenge) => latest.get(challenge.id)?.correct)
    const concept = input.trackAccuracy[track]
    const accuracy = concept && concept.attempts > 0 ? concept.accuracyPct : null
    const labs = labsFor(track)
    const skillLabIds = input.labs.filter((lab) => (LAB_SKILLS[lab.id] ?? []).includes(track)).map((lab) => lab.id)
    const reports = reportsFor(skillLabIds)
    const skillStatus = status(accuracy, labs.length + reports.length + solved.length)
    const nextPlan = [
      ...(challenges.length > 0 && solved.length < challenges.length ? [`Solve ${challenges.length - solved.length} more ${TRACKS[track].short} challenge(s).`] : []),
      ...(accuracy === null || accuracy < 70 ? [`Drill the ${TRACKS[track].short} question track to 70%+ accuracy.`] : []),
    ]
    return {
      id: track,
      name: TRACKS[track].name,
      kind: 'ceh-plus',
      status: skillStatus,
      conceptAccuracyPct: accuracy,
      conceptAttempts: concept?.attempts ?? 0,
      labs: labs.map((lab) => lab.title),
      reports,
      challengesSolved: solved.length,
      challengesTotal: challenges.length,
      weakModules: [],
      nextPlan: nextPlan.length > 0 ? nextPlan : ['Turn one solved challenge into a portfolio story.'],
    }
  })

  return [...domainSkills, ...trackSkills]
}

/** Honest-gap statement for interviews: what is not strong yet and the concrete plan. */
export function honestGapStatement(skill: SkillEvidence): string {
  const evidence = skill.conceptAccuracyPct === null
    ? 'I have not practiced it enough yet'
    : `my practice accuracy is ${skill.conceptAccuracyPct}%`
  return `${skill.name} is still a growth area — ${evidence}. My plan: ${skill.nextPlan.slice(0, 2).join(' ')}`
}

export function blankStory(skill: SkillEvidence, now = Date.now()): InterviewStory {
  const evidence = [...skill.labs, ...skill.reports].slice(0, 2).join('; ')
  return {
    id: uid('is-'),
    skillId: skill.id,
    kind: skill.status === 'gap' ? 'gap' : 'strength',
    format: skill.status === 'gap' ? 'concise' : 'star',
    title: skill.status === 'gap' ? `Growth area: ${skill.name}` : `${skill.name} in practice`,
    situation: evidence ? `In a synthetic training lab (${evidence}), ` : '',
    task: '',
    action: '',
    result: '',
    memo: skill.status === 'gap' ? honestGapStatement(skill) : '',
    evidence: [...skill.labs, ...skill.reports],
    createdAt: now,
    updatedAt: now,
  }
}

/** Approximate speaking time at ~130 words per minute. */
export function speakingSeconds(text: string): number {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return Math.round((words / 130) * 60)
}

export function memoLengthStatus(text: string): 'short' | 'good' | 'long' {
  const seconds = speakingSeconds(text)
  if (seconds < 45) return 'short'
  if (seconds > 150) return 'long'
  return 'good'
}

export function storyComplete(story: InterviewStory): boolean {
  if (story.format === 'star') {
    return [story.situation, story.task, story.action, story.result].every((part) => part.trim().length >= 15)
  }
  return story.memo.trim().length >= 40
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeStories(value: unknown): InterviewStory[] {
  if (!Array.isArray(value)) return []
  const byId = new Map<string, InterviewStory>()
  for (const row of value) {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.skillId !== 'string' || typeof row.title !== 'string') continue
    const text = (key: string, max = 4000) => (typeof row[key] === 'string' ? (row[key] as string).slice(0, max) : '')
    const createdAt = typeof row.createdAt === 'number' && row.createdAt > 0 ? row.createdAt : Date.now()
    byId.set(row.id, {
      id: row.id,
      skillId: row.skillId,
      kind: row.kind === 'gap' ? 'gap' : 'strength',
      format: row.format === 'concise' ? 'concise' : 'star',
      title: row.title.slice(0, 200),
      situation: text('situation'),
      task: text('task'),
      action: text('action'),
      result: text('result'),
      memo: text('memo', 6000),
      evidence: Array.isArray(row.evidence) ? row.evidence.filter((item): item is string => typeof item === 'string').slice(0, 20) : [],
      createdAt,
      updatedAt: typeof row.updatedAt === 'number' && row.updatedAt > 0 ? row.updatedAt : createdAt,
    })
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt)
}
