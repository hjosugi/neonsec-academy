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

export interface ReadinessCriteria {
  requiredMockCount: number
  mockScorePct: number
  coveragePct: number
  maxDueBacklog: number
  weakModuleMasteryPct: number
  maxWeakModules: number
}

export interface ReadinessGate {
  id: 'mock-stability' | 'coverage' | 'due-backlog' | 'weak-modules'
  label: string
  passed: boolean
  detail: string
  nextAction: string
}

export interface Readiness {
  score: number // 0..100
  band: Band
  label: string
  factors: ReadinessFactor[]
  gates: ReadinessGate[]
  nextActions: string[]
  criteria: ReadinessCriteria
}

export const READINESS_DEFAULTS: ReadinessCriteria = {
  requiredMockCount: 3,
  mockScorePct: 85,
  coveragePct: 80,
  maxDueBacklog: 0,
  weakModuleMasteryPct: 70,
  maxWeakModules: 0,
}

function boundedInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function normalizeReadinessCriteria(input: Partial<ReadinessCriteria> = {}): ReadinessCriteria {
  return {
    requiredMockCount: boundedInt(input.requiredMockCount, READINESS_DEFAULTS.requiredMockCount, 1, 5),
    mockScorePct: boundedInt(input.mockScorePct, READINESS_DEFAULTS.mockScorePct, 50, 100),
    coveragePct: boundedInt(input.coveragePct, READINESS_DEFAULTS.coveragePct, 0, 100),
    maxDueBacklog: boundedInt(input.maxDueBacklog, READINESS_DEFAULTS.maxDueBacklog, 0, 500),
    weakModuleMasteryPct: boundedInt(input.weakModuleMasteryPct, READINESS_DEFAULTS.weakModuleMasteryPct, 0, 100),
    maxWeakModules: boundedInt(input.maxWeakModules, READINESS_DEFAULTS.maxWeakModules, 0, 20),
  }
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
  inputCriteria: Partial<ReadinessCriteria> = {},
): Readiness {
  const criteria = normalizeReadinessCriteria(inputCriteria)
  const recent = results.slice().sort((a, b) => b.submittedAt - a.submittedAt)
  const latestMock = recent.length ? recent[0].scorePct : 0
  const gateMocks = recent.slice(0, criteria.requiredMockCount)
  const gateScores = gateMocks.map((r) => r.scorePct)
  const consistency = recent.length < 2 ? 40 : clamp(100 - stdev(gateScores) * 2.2, 0, 100)

  const coverage = clamp(ov.coverage * 100, 0, 100)

  const started = mods.filter((m) => m.total > 0 && m.attempts > 0)
  const masteryAvg = started.length
    ? (started.reduce((s, m) => s + m.mastery, 0) / started.length) * 100
    : 0

  const reviewHealth = clamp(100 - ov.dueToday * 2.5, 0, 100)
  const weakModules = mods
    .filter((m) => m.total > 0 && m.attempts > 0 && m.mastery * 100 < criteria.weakModuleMasteryPct)
    .sort((a, b) => a.mastery - b.mastery || a.module - b.module)
  const weakHealth = clamp(100 - weakModules.length * 18, 0, 100)

  const factors: ReadinessFactor[] = [
    { name: 'Latest mock', value: latestMock, weightPct: 30, hint: 'Score on your most recent mock exam' },
    { name: 'Coverage', value: coverage, weightPct: 16, hint: 'Share of the bank you have attempted' },
    { name: 'Mastery', value: masteryAvg, weightPct: 18, hint: 'Average mastery of started modules' },
    { name: 'Consistency', value: consistency, weightPct: 12, hint: 'Stability across your last 3 mocks' },
    { name: 'Review health', value: reviewHealth, weightPct: 12, hint: 'How under-control your due backlog is' },
    { name: 'Weak modules', value: weakHealth, weightPct: 12, hint: 'Penalty for modules below the readiness mastery threshold' },
  ]

  const score = clamp(
    Math.round(
      factors.reduce((s, f) => s + (f.value * f.weightPct) / 100, 0),
    ),
    0,
    100,
  )

  const mockPassed =
    gateMocks.length >= criteria.requiredMockCount &&
    gateMocks.every((r) => r.scorePct >= criteria.mockScorePct) &&
    consistency >= 75
  const coveragePassed = coverage >= criteria.coveragePct
  const duePassed = ov.dueToday <= criteria.maxDueBacklog
  const weakPassed = weakModules.length <= criteria.maxWeakModules
  const gates: ReadinessGate[] = [
    {
      id: 'mock-stability',
      label: 'Mock stability',
      passed: mockPassed,
      detail:
        gateMocks.length < criteria.requiredMockCount
          ? `${criteria.requiredMockCount - gateMocks.length} more mock result(s) needed.`
          : `${gateScores.map((score) => `${Math.round(score)}%`).join(', ')}; consistency ${Math.round(consistency)}.`,
      nextAction:
        gateMocks.length < criteria.requiredMockCount
          ? `Complete ${criteria.requiredMockCount - gateMocks.length} more mock exam(s) at ${criteria.mockScorePct}% or higher.`
          : `Rebuild a ${criteria.requiredMockCount}-mock streak at ${criteria.mockScorePct}%+ with stable scores.`,
    },
    {
      id: 'coverage',
      label: 'Coverage',
      passed: coveragePassed,
      detail: `${Math.round(coverage)}% attempted; target ${criteria.coveragePct}%.`,
      nextAction: `Raise bank coverage to ${criteria.coveragePct}% before treating readiness as green.`,
    },
    {
      id: 'due-backlog',
      label: 'Due backlog',
      passed: duePassed,
      detail: `${ov.dueToday} due; limit ${criteria.maxDueBacklog}.`,
      nextAction: `Clear due review backlog to ${criteria.maxDueBacklog} or fewer.`,
    },
    {
      id: 'weak-modules',
      label: 'Weak modules',
      passed: weakPassed,
      detail: `${weakModules.length} below ${criteria.weakModuleMasteryPct}% mastery; limit ${criteria.maxWeakModules}.`,
      nextAction: `Drill weak modules until ${criteria.maxWeakModules} or fewer are below ${criteria.weakModuleMasteryPct}% mastery.`,
    },
  ]
  const nextActions = gates.filter((gate) => !gate.passed).map((gate) => gate.nextAction)

  let band: Band = 'red'
  let label = 'Keep Training'
  if (score >= 75 && gates.every((gate) => gate.passed)) {
    band = 'green'
    label = 'Exam Ready'
  } else if (score >= 55) {
    band = 'amber'
    label = 'Getting Close'
  }

  return { score, band, label, factors, gates, nextActions, criteria }
}
