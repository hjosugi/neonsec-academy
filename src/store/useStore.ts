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
  ExamSession,
  ExamResult,
  Grade,
  MistakeNote,
  Profile,
  Question,
  RawQuestion,
  Report,
  ReviewItem,
  ReviewSessionSummary,
  Settings,
} from '../types'
import { SEED_QUESTIONS, enrichQuestion } from '../data/questions'
import { XP } from '../data/taxonomy'
import { DAY, dayKey, startOfDay } from '../lib/format'
import { uid } from '../lib/id'
import { autoGrade, newReviewItem, scheduleNext } from '../lib/srs'
import { isCorrect } from '../lib/grade'
import { moduleStats, domainStats } from '../lib/analytics'
import { computeDerivedBadges } from '../lib/badges'
import { gradeExam } from '../lib/exam'

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
  archivedIds: string[]
  userQuestions: RawQuestion[]
  examResults: ExamResult[]
  activeExam: ExamSession | null
  reports: Report[]
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
  examGoto: (index: number) => void
  cancelExam: () => void
  submitExam: () => ExamResult | null
  // reports
  upsertReport: (report: Report) => void
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
  archivedIds: [],
  userQuestions: [],
  examResults: [],
  activeExam: null,
  reports: [],
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
            const chosen = session.answers[qid]?.chosen ?? null
            const hasAnswer = chosen != null && !(Array.isArray(chosen) && chosen.length === 0)
            if (!hasAnswer) continue
            const correct = isCorrect(q, chosen)
            attempts.push({ id: uid('a-'), questionId: qid, at: now, correct, chosen, mode: 'exam' })
            const existing = reviews[qid] ?? newReviewItem(qid, now)
            reviews[qid] = scheduleNext(existing, autoGrade(correct), now)
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

      upsertReport: (report) =>
        set((s) => {
          const idx = s.reports.findIndex((r) => r.id === report.id)
          const reports = [...s.reports]
          if (idx >= 0) reports[idx] = report
          else reports.unshift(report)
          return { reports }
        }),

      deleteReport: (id) => set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),

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
          examResults: [],
          activeExam: null,
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
          archivedIds: s.archivedIds,
          userQuestions: s.userQuestions,
          examResults: s.examResults,
          reports: s.reports,
        }
        return JSON.stringify(payload, null, 2)
      },

      importData: (json) => {
        try {
          const d = JSON.parse(json)
          if (typeof d !== 'object' || d === null) return false
          set((s) => ({
            profile: { ...defaultProfile, ...(d.profile ?? {}) },
            settings: { ...defaultSettings, ...(d.settings ?? {}) },
            attempts: Array.isArray(d.attempts) ? d.attempts : s.attempts,
            reviews: d.reviews ?? s.reviews,
            mistakes: d.mistakes ?? s.mistakes,
            bookmarks: Array.isArray(d.bookmarks) ? d.bookmarks : s.bookmarks,
            pinNotes: d.pinNotes && typeof d.pinNotes === 'object' ? d.pinNotes : s.pinNotes,
            reviewSummaries: Array.isArray(d.reviewSummaries) ? d.reviewSummaries : s.reviewSummaries,
            archivedIds: Array.isArray(d.archivedIds) ? d.archivedIds : s.archivedIds,
            userQuestions: Array.isArray(d.userQuestions) ? d.userQuestions : s.userQuestions,
            examResults: Array.isArray(d.examResults) ? d.examResults : s.examResults,
            reports: Array.isArray(d.reports) ? d.reports : s.reports,
          }))
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
        archivedIds: s.archivedIds,
        userQuestions: s.userQuestions,
        examResults: s.examResults,
        activeExam: s.activeExam,
        reports: s.reports,
      }),
    },
  ),
)
