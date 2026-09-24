import { describe, expect, it } from 'vitest'
import { SEED_QUESTIONS } from '../data/questions'
import type { PracticalSession } from '../types'
import {
  PRACTICAL_COMPOSITION,
  PRACTICAL_KINDS,
  PRACTICAL_SESSION_SIZE,
  createPracticalSession,
  gradePracticalSession,
  practicalKind,
  practicalPoolStats,
  practicalResultToMarkdown,
  selectPracticalChallenges,
} from './practicalSim'

describe('practical simulator content', () => {
  it('ships enough synthetic challenges for every kind in the session composition', () => {
    const stats = practicalPoolStats(SEED_QUESTIONS)
    for (const kind of PRACTICAL_KINDS) expect(stats[kind]).toBeGreaterThanOrEqual(PRACTICAL_COMPOSITION[kind])
    expect(Object.values(PRACTICAL_COMPOSITION).reduce((a, b) => a + b, 0)).toBe(PRACTICAL_SESSION_SIZE)
  })
})

describe('practical session generation', () => {
  it('selects 20 unique challenges with the kind composition, reproducibly per seed', () => {
    const picked = selectPracticalChallenges(SEED_QUESTIONS, 42)
    expect(picked).toHaveLength(PRACTICAL_SESSION_SIZE)
    expect(new Set(picked.map((q) => q.id)).size).toBe(PRACTICAL_SESSION_SIZE)
    for (const kind of PRACTICAL_KINDS) {
      expect(picked.filter((q) => practicalKind(q) === kind)).toHaveLength(PRACTICAL_COMPOSITION[kind])
    }
    expect(selectPracticalChallenges(SEED_QUESTIONS, 42).map((q) => q.id)).toEqual(picked.map((q) => q.id))
    expect(new Set(picked.map((q) => q.module)).size).toBeGreaterThanOrEqual(12)
  })

  it('refuses to start when the pool is too small', () => {
    expect(createPracticalSession(SEED_QUESTIONS.slice(0, 5), { durationMin: 60, presetLabel: 'x' })).toBeNull()
  })
})

describe('practical grading and readiness report', () => {
  it('aggregates by module, skill, and kind and lists wrong and weak challenges', () => {
    const session = createPracticalSession(SEED_QUESTIONS, { seed: 7, durationMin: 120, presetLabel: 'Sprint', now: 1_000 }) as PracticalSession
    const byId = new Map(SEED_QUESTIONS.map((q) => [q.id, q]))
    const [first, second, third, ...rest] = session.questionIds
    const answers: PracticalSession['answers'] = {}
    for (const id of rest) {
      const q = byId.get(id)!
      answers[id] = q.type === 'report_prompt' ? { chosen: 'My finding', selfCorrect: true } : { chosen: String(q.answer) }
    }
    const q1 = byId.get(first)!
    answers[first] = q1.type === 'report_prompt'
      ? { chosen: 'too short', selfCorrect: false }
      : { chosen: (q1.choices ?? []).find((choice) => choice !== q1.answer) ?? null }
    const q2 = byId.get(second)!
    answers[second] = q2.type === 'report_prompt' ? { chosen: 'ok', selfCorrect: true, unsure: true } : { chosen: String(q2.answer), unsure: true }

    const result = gradePracticalSession({ ...session, answers }, SEED_QUESTIONS, 1_000 + 30 * 60_000)
    expect(result.total).toBe(20)
    expect(result.correct).toBe(18)
    expect(result.answered).toBe(19)
    expect(result.scorePct).toBe(90)
    expect(result.passed).toBe(true)
    expect(result.wrongIds).toEqual([first, third])
    expect(result.weakIds).toEqual([second])
    expect(result.timeUsedSec).toBe(1800)
    expect(result.perKind.reduce((sum, row) => sum + row.total, 0)).toBe(20)
    expect(result.perModule.reduce((sum, row) => sum + row.total, 0)).toBe(20)
    expect(result.perSkill.length).toBeGreaterThan(3)
    expect(result.nextActions[0]).toContain('2 missed challenges')

    const markdown = practicalResultToMarkdown(result)
    expect(markdown).toContain('# Practical Readiness Report')
    expect(markdown).toContain('## By CEH module')
    expect(markdown).toContain('## By skill')
  })
})
