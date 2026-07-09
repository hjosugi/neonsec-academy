// Derived-data hooks built on top of the store. Memoized so components
// only recompute when the underlying user data (or the calendar day) changes.
import { useMemo } from 'react'
import type { ModuleStat, Question, ReviewItem } from '../types'
import { buildActiveQuestions, buildQuestionCatalog, useStore } from './useStore'
import { moduleStats, domainStats, overview } from '../lib/analytics'
import { computeReadiness } from '../lib/readiness'
import { isDue } from '../lib/srs'
import { startOfDay } from '../lib/format'
import { rankFor } from '../data/taxonomy'

export function useActiveQuestions(): Question[] {
  const userQuestions = useStore((s) => s.userQuestions)
  const archivedIds = useStore((s) => s.archivedIds)
  return useMemo(() => buildActiveQuestions(userQuestions, archivedIds), [userQuestions, archivedIds])
}

export function useAllQuestions(): Question[] {
  const userQuestions = useStore((s) => s.userQuestions)
  return useMemo(() => buildQuestionCatalog(userQuestions), [userQuestions])
}

export function useQuestionMap(): Map<string, Question> {
  const qs = useActiveQuestions()
  return useMemo(() => new Map(qs.map((q) => [q.id, q])), [qs])
}

export function useAllQuestionMap(): Map<string, Question> {
  const qs = useAllQuestions()
  return useMemo(() => new Map(qs.map((q) => [q.id, q])), [qs])
}

export function useModuleStats(): ModuleStat[] {
  const qs = useActiveQuestions()
  const attempts = useStore((s) => s.attempts)
  const reviews = useStore((s) => s.reviews)
  const day = startOfDay(Date.now())
  return useMemo(() => moduleStats(qs, attempts, reviews, day), [qs, attempts, reviews, day])
}

export function useDomainStats() {
  const mods = useModuleStats()
  return useMemo(() => domainStats(mods), [mods])
}

export function useOverview() {
  const qs = useActiveQuestions()
  const attempts = useStore((s) => s.attempts)
  const reviews = useStore((s) => s.reviews)
  const day = startOfDay(Date.now())
  return useMemo(() => overview(qs, attempts, reviews, day), [qs, attempts, reviews, day])
}

export function useReadiness() {
  const results = useStore((s) => s.examResults)
  const profileTarget = useStore((s) => s.profile.examTargetPct)
  const settings = useStore((s) => s.settings)
  const ov = useOverview()
  const mods = useModuleStats()
  return useMemo(
    () =>
      computeReadiness(results, ov, mods, {
        requiredMockCount: settings.readinessRequiredMocks,
        mockScorePct: profileTarget,
        coveragePct: settings.coverageThresholdPct,
        maxDueBacklog: settings.readinessMaxDueBacklog,
        weakModuleMasteryPct: settings.readinessWeakModuleMasteryPct,
        maxWeakModules: settings.readinessMaxWeakModules,
      }),
    [mods, ov, profileTarget, results, settings],
  )
}

export interface DueEntry {
  question: Question
  item: ReviewItem
}

export function useDueQueue(limit?: number): DueEntry[] {
  const qmap = useQuestionMap()
  const reviews = useStore((s) => s.reviews)
  const reviewDailyLimit = useStore((s) => s.settings.reviewDailyLimit ?? 20)
  const day = startOfDay(Date.now())
  return useMemo(() => {
    const due = Object.values(reviews).filter((r) => isDue(r, day) && qmap.has(r.questionId))
    due.sort((a, b) => a.dueAt - b.dueAt || a.ease - b.ease)
    const arr = due.map((r) => ({ question: qmap.get(r.questionId)!, item: r }))
    const cap = typeof limit === 'number' ? limit : reviewDailyLimit
    return cap > 0 ? arr.slice(0, cap) : arr
  }, [reviews, qmap, day, limit, reviewDailyLimit])
}

export function useRank() {
  const xp = useStore((s) => s.profile.xp)
  return useMemo(() => rankFor(xp), [xp])
}
