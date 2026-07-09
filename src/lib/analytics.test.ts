import { describe, it, expect } from 'vitest'
import type { Attempt } from '../types'
import { moduleStats, domainStats, weakestModules, overview } from './analytics'
import { mkQ } from './testfixtures'

const T0 = new Date('2026-07-08T10:00:00Z').getTime()
const attempt = (
  questionId: string,
  correct: boolean,
  patch: Partial<Attempt> = {},
): Attempt => ({
  id: 'a-' + questionId,
  questionId,
  at: T0,
  correct,
  chosen: 'A',
  mode: 'practice',
  ...patch,
})

const qs = [mkQ('a', 1), mkQ('b', 1), mkQ('c', 1), mkQ('d', 1), mkQ('e', 2), mkQ('f', 2)]

describe('analytics / moduleStats', () => {
  it('computes coverage, accuracy and mastery per module', () => {
    const attempts = [attempt('a', true), attempt('b', false)]
    const mods = moduleStats(qs, attempts, {}, T0)
    const m1 = mods.find((m) => m.module === 1)!
    expect(m1.total).toBe(4)
    expect(m1.seen).toBe(2)
    expect(m1.correct).toBe(1)
    expect(m1.attempts).toBe(2)
    expect(m1.accuracy).toBeCloseTo(0.5, 5)
    // mastery = 0.35 * (2/4) + 0.65 * 0.5 = 0.5
    expect(m1.mastery).toBeCloseTo(0.5, 5)
    expect(m1.avgConfidence).toBe(-1)
    expect(m1.recentTrend).toBe('insufficient')
  })

  it('marks untouched modules with accuracy -1', () => {
    const mods = moduleStats(qs, [], {}, T0)
    const m2 = mods.find((m) => m.module === 2)!
    expect(m2.attempts).toBe(0)
    expect(m2.accuracy).toBe(-1)
    expect(m2.avgConfidence).toBe(-1)
    expect(m2.recentTrend).toBe('insufficient')
    expect(m2.mastery).toBe(0)
  })

  it('computes average confidence and recent trend', () => {
    const attempts = [
      attempt('a', false, { id: 'a-1', at: T0 + 1, confidence: 2 }),
      attempt('b', false, { id: 'a-2', at: T0 + 2, confidence: 3 }),
      attempt('c', true, { id: 'a-3', at: T0 + 3, confidence: 4 }),
      attempt('d', true, { id: 'a-4', at: T0 + 4, confidence: 5 }),
    ]
    const mods = moduleStats(qs, attempts, {}, T0)
    const m1 = mods.find((m) => m.module === 1)!
    expect(m1.avgConfidence).toBeCloseTo(3.5, 5)
    expect(m1.recentTrend).toBe('up')
  })
})

describe('analytics / weakestModules + domainStats + overview', () => {
  it('orders started-but-weak modules before unstarted', () => {
    const attempts = [attempt('a', false), attempt('b', false)]
    const mods = moduleStats(qs, attempts, {}, T0)
    const weak = weakestModules(mods, 5)
    expect(weak[0].module).toBe(1) // started, low mastery
    expect(weak.some((m) => m.module === 2)).toBe(true) // unstarted with content
  })

  it('aggregates modules into their exam domain', () => {
    const attempts = [attempt('a', true), attempt('e', true)]
    const mods = moduleStats(qs, attempts, {}, T0)
    const recon = domainStats(mods).find((d) => d.domainId === 'recon')!
    expect(recon.total).toBe(2) // module 2 questions
    expect(recon.correct).toBe(1)
  })

  it('overview reports coverage and overall accuracy', () => {
    const attempts = [attempt('a', true), attempt('b', false)]
    const ov = overview(qs, attempts, {}, T0)
    expect(ov.totalQuestions).toBe(6)
    expect(ov.attemptedUnique).toBe(2)
    expect(ov.coverage).toBeCloseTo(2 / 6, 5)
    expect(ov.overallAccuracy).toBeCloseTo(0.5, 5)
  })
})
