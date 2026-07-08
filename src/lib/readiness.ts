// ============================================================
// Exam readiness (RAG) — blends mock scores, coverage, mastery,
// consistency, and review backlog. See docs/REVIEW_SYSTEM.md
// ============================================================
import type { ExamResult, ModuleStat } from '../types'
import type { Overview } from './analytics'
import { clamp } from './format'

export type Band = 'green' | 'amber' | 'red'

export interface ReadinessFactor {
  name: string
  value: number // 0..100
  weightPct: number
  hint: string
}

export interface Readiness {
  score: number // 0..100
  band: Band
  label: string
  factors: ReadinessFactor[]
}

function stdev(nums: number[]): number {
  if (nums.length < 2) return 0
  const mean = nums.reduce((s, n) => s + n, 0) / nums.length
  const variance = nums.reduce((s, n) => s + (n - mean) ** 2, 0) / nums.length
  return Math.sqrt(variance)
}

export function computeReadiness(
  results: ExamResult[],
  ov: Overview,
  mods: ModuleStat[],
): Readiness {
  const recent = results.slice().sort((a, b) => b.submittedAt - a.submittedAt)
  const latestMock = recent.length ? recent[0].scorePct : 0
  const last3 = recent.slice(0, 3).map((r) => r.scorePct)
  const consistency = recent.length < 2 ? 45 : clamp(100 - stdev(last3) * 2.2, 0, 100)

  const coverage = clamp(ov.coverage * 100, 0, 100)

  const started = mods.filter((m) => m.total > 0 && m.attempts > 0)
  const masteryAvg = started.length
    ? (started.reduce((s, m) => s + m.mastery, 0) / started.length) * 100
    : 0

  const reviewHealth = clamp(100 - ov.dueToday * 2.5, 0, 100)

  const factors: ReadinessFactor[] = [
    { name: 'Latest mock', value: latestMock, weightPct: 38, hint: 'Score on your most recent mock exam' },
    { name: 'Coverage', value: coverage, weightPct: 18, hint: 'Share of the bank you have attempted' },
    { name: 'Mastery', value: masteryAvg, weightPct: 22, hint: 'Average mastery of started modules' },
    { name: 'Consistency', value: consistency, weightPct: 12, hint: 'Stability across your last 3 mocks' },
    { name: 'Review health', value: reviewHealth, weightPct: 10, hint: 'How under-control your due backlog is' },
  ]

  const score = clamp(
    Math.round(
      factors.reduce((s, f) => s + (f.value * f.weightPct) / 100, 0),
    ),
    0,
    100,
  )

  let band: Band = 'red'
  let label = 'Keep Training'
  if (score >= 75) {
    band = 'green'
    label = 'Exam Ready'
  } else if (score >= 55) {
    band = 'amber'
    label = 'Getting Close'
  }

  return { score, band, label, factors }
}
