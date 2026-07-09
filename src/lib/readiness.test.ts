import { describe, it, expect } from 'vitest'
import type { ExamResult, ModuleStat } from '../types'
import type { Overview } from './analytics'
import { computeReadiness } from './readiness'

const ov = (coverage: number, dueToday = 0): Overview => ({
  totalQuestions: 100,
  attemptedUnique: Math.round(coverage * 100),
  coverage,
  overallAccuracy: 0.8,
  dueToday,
  reviewBacklog: 0,
  weakModuleCount: 0,
})

const strongMod: ModuleStat = {
  module: 1, moduleName: 'M1', domain: 'overview', district: 'gate',
  total: 4, seen: 4, correct: 4, attempts: 4, accuracy: 1, dueCount: 0, mastery: 0.9,
  avgConfidence: 4,
  recentTrend: 'flat',
}

const mockResult = (scorePct: number, submittedAt = scorePct): ExamResult => ({
  sessionId: 's' + submittedAt, preset: 'full', presetLabel: 'Full', submittedAt,
  total: 125, answered: 125, correct: 0, scorePct, passMark: 70, passed: scorePct >= 70,
  perDomain: [], timeUsedSec: 0, durationSec: 0, questionIds: [], answers: {},
})

describe('readiness', () => {
  it('is red with no activity', () => {
    const r = computeReadiness([], ov(0), [])
    expect(r.band).toBe('red')
    expect(r.score).toBeLessThan(55)
    expect(r.factors).toHaveLength(6)
    expect(r.nextActions.length).toBeGreaterThan(0)
  })

  it('is green with stable mocks, coverage, backlog and mastery gates', () => {
    const r = computeReadiness(
      [mockResult(90, 1), mockResult(88, 2), mockResult(91, 3)],
      ov(1, 0),
      [strongMod],
      { mockScorePct: 85, requiredMockCount: 3, coveragePct: 80, maxDueBacklog: 0, weakModuleMasteryPct: 70, maxWeakModules: 0 },
    )
    expect(r.band).toBe('green')
    expect(r.score).toBeGreaterThanOrEqual(75)
    expect(r.label).toBe('Exam Ready')
    expect(r.nextActions).toHaveLength(0)
  })

  it('does not turn green until required mock stability is satisfied', () => {
    const r = computeReadiness(
      [mockResult(92, 1)],
      ov(1, 0),
      [strongMod],
      { mockScorePct: 85, requiredMockCount: 3, coveragePct: 80, maxDueBacklog: 0, weakModuleMasteryPct: 70, maxWeakModules: 0 },
    )
    expect(r.band).not.toBe('green')
    expect(r.nextActions[0]).toContain('2 more mock')
  })

  it('keeps the score within 0..100', () => {
    const r = computeReadiness([mockResult(100)], ov(1), [strongMod])
    expect(r.score).toBeLessThanOrEqual(100)
    expect(r.score).toBeGreaterThanOrEqual(0)
  })
})
