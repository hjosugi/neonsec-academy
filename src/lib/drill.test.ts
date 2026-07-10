import { describe, expect, it } from 'vitest'
import type { Attempt, Question } from '../types'
import { mkQ } from './testfixtures'
import { buildDrillQueue, DRILL_LENGTHS, recentQuestionIds } from './drill'

const base = {
  source: 'all' as const,
  module: 1,
  track: 'pentest' as const,
  tag: 'any',
  type: 'any' as const,
  difficulty: 'any' as const,
  count: 10,
  seed: 1,
}

const attempt = (questionId: string, at: number): Attempt => ({
  id: `a-${questionId}-${at}`,
  questionId,
  at,
  correct: true,
  chosen: 'A',
  mode: 'drill',
})

describe('drill queue builder', () => {
  it('exposes the required quick lengths', () => {
    expect(DRILL_LENGTHS).toEqual([10, 20, 30])
  })

  it('filters by module, tag, question type, and difficulty', () => {
    const qs: Question[] = [
      mkQ('crypto-good', 20, { tags: ['crypto', 'key'], type: 'multi', difficulty: 'hard' }),
      mkQ('wrong-module', 1, { tags: ['crypto', 'key'], type: 'multi', difficulty: 'hard' }),
      mkQ('wrong-tag', 20, { tags: ['hash'], type: 'multi', difficulty: 'hard' }),
      mkQ('wrong-type', 20, { tags: ['crypto'], type: 'mcq', difficulty: 'hard' }),
      mkQ('wrong-diff', 20, { tags: ['crypto'], type: 'multi', difficulty: 'easy' }),
    ]

    const result = buildDrillQueue(qs, {
      ...base,
      source: 'module',
      module: 20,
      tag: 'crypto',
      type: 'multi',
      difficulty: 'hard',
      count: 10,
    })

    expect(result.available).toBe(1)
    expect(result.questionIds).toEqual(['crypto-good'])
  })

  it('prefers questions not seen in recent attempts', () => {
    const qs = [mkQ('fresh-a', 1), mkQ('fresh-b', 1), mkQ('recent-a', 1), mkQ('recent-b', 1)]
    const result = buildDrillQueue(qs, {
      ...base,
      count: 2,
      recentQuestionIds: ['recent-a', 'recent-b'],
    })

    expect(result.questionIds.sort()).toEqual(['fresh-a', 'fresh-b'])
    expect(result.fallbackUsed).toBe(false)
  })

  it('falls back to recent questions only when the fresh pool is too small', () => {
    const qs = [mkQ('fresh', 1), mkQ('recent-a', 1), mkQ('recent-b', 1)]
    const result = buildDrillQueue(qs, {
      ...base,
      count: 3,
      recentQuestionIds: ['recent-a', 'recent-b'],
    })

    expect(result.questionIds).toHaveLength(3)
    expect(result.questionIds).toContain('fresh')
    expect(result.fallbackUsed).toBe(true)
  })

  it('extracts unique recent question ids newest first', () => {
    const ids = recentQuestionIds([
      attempt('old', 1),
      attempt('repeat', 2),
      attempt('new', 4),
      attempt('repeat', 5),
    ], 3)

    expect(ids).toEqual(['repeat', 'new', 'old'])
  })
})
