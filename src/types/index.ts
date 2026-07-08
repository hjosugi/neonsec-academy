// ============================================================
// NeonSec Academy — domain types
// Aligned with docs/DATA_MODEL.md and docs/QUESTION_SCHEMA.md
// ============================================================

export type QType = 'mcq' | 'multi' | 'true_false' | 'scenario'
export type Difficulty = 'easy' | 'medium' | 'hard'

export type TrackKey = 'pentest' | 'appsec' | 'cloud' | 'soc' | 'ir' | 'threat-model'

export type DomainId =
  | 'overview'
  | 'recon'
  | 'system'
  | 'network'
  | 'web'
  | 'wireless'
  | 'mobile-iot'
  | 'cloud'
  | 'crypto'
  | 'beyond'

export type DistrictId =
  | 'gate'
  | 'ghost-market'
  | 'root-alley'
  | 'firewall-ring'
  | 'web-alley'
  | 'neon-airspace'
  | 'cloud-spire'
  | 'beyond-district'

export interface Explanation {
  answer: string
  why: string
  trap: string
  memory_phrase: string
}

/** Raw question as authored in the JSON seed files / by the user. */
export interface RawQuestion {
  id: string
  type: QType
  module: number // 1-20 for CEH modules, 0 for CEH+ tracks
  track?: TrackKey | null
  difficulty: Difficulty
  tags: string[]
  body: string
  choices?: string[]
  answer: string | string[]
  explanation: Explanation
  status?: 'active' | 'archived'
  source?: 'seed' | 'user'
}

/** Question enriched with derived display fields at load time. */
export interface Question extends RawQuestion {
  moduleName: string
  domain: DomainId
  domainName: string
  district: DistrictId
}

// ---- Spaced repetition ----
export type Grade = 'again' | 'hard' | 'good' | 'easy'

export interface ReviewItem {
  questionId: string
  ease: number
  intervalDays: number
  reps: number
  lapses: number
  dueAt: number // epoch ms
  lastResult: 'correct' | 'incorrect' | null
  lastReviewed: number | null
  suspended: boolean
}

// ---- Attempts ----
export type AttemptMode = 'practice' | 'review' | 'exam' | 'drill'

export interface Attempt {
  id: string
  questionId: string
  at: number
  correct: boolean
  chosen: string | string[] | null
  mode: AttemptMode
  timeMs?: number
}

// ---- Mistake notebook ----
export interface MistakeNote {
  questionId: string
  whyWrong: string
  correctReasoning: string
  trapPattern: string
  memoryPhrase: string
  nextAction: string
  createdAt: number
  updatedAt: number
  resolved: boolean
}

// ---- Mock exam ----
export type ExamPresetId = 'full' | 'half' | 'quick' | 'weak'

export interface ExamAnswer {
  chosen: string | string[] | null
  flagged: boolean
}

export interface ExamSession {
  id: string
  createdAt: number
  preset: ExamPresetId
  presetLabel: string
  questionIds: string[]
  answers: Record<string, ExamAnswer>
  durationSec: number
  startedAt: number
  endedAt: number | null
  currentIndex: number
  status: 'in-progress' | 'submitted'
}

export interface DomainScore {
  domainId: DomainId
  domainName: string
  total: number
  correct: number
  pct: number
}

export interface ExamResult {
  sessionId: string
  preset: ExamPresetId
  presetLabel: string
  submittedAt: number
  total: number
  answered: number
  correct: number
  scorePct: number
  passMark: number
  passed: boolean
  perDomain: DomainScore[]
  timeUsedSec: number
  durationSec: number
  questionIds: string[]
  answers: Record<string, string | string[] | null>
}

// ---- Player / settings ----
export interface Profile {
  xp: number
  streakDays: number
  lastActiveDay: string | null // YYYY-MM-DD
  badges: string[]
  createdAt: number
  examTargetPct: number
  onboarded: boolean
}

export interface Settings {
  reduceMotion: boolean
  lowGlow: boolean
  highContrast: boolean
  scanlines: boolean
  sound: boolean
  dailyGoal: number
}

// ---- Derived analytics ----
export interface ModuleStat {
  module: number
  moduleName: string
  domain: DomainId
  district: DistrictId
  total: number
  seen: number
  correct: number
  attempts: number
  accuracy: number // 0..1 over attempts, -1 if none
  dueCount: number
  mastery: number // 0..1 blended score
}

export interface DomainStat {
  domainId: DomainId
  domainName: string
  weightPct: number
  total: number
  attempts: number
  correct: number
  accuracy: number
  mastery: number
}

// ---- Report builder (Phase 4/5, safe synthetic scenarios only) ----
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info'

export interface Finding {
  id: string
  title: string
  severity: Severity
  impact: string
  remediation: string
  evidence: string
}

export interface Report {
  id: string
  title: string
  scope: string
  summary: string
  findings: Finding[]
  createdAt: number
  updatedAt: number
}
