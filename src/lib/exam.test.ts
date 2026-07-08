import { describe, it, expect } from 'vitest'
import type { ExamSession, Question } from '../types'
import { buildExamQuestionIds, gradeExam } from './exam'
import { EXAM } from '../data/taxonomy'
import { mkQ } from './testfixtures'

// pool spanning several modules/domains, plus a CEH+ (module 0) item that must be excluded
function bigPool(): Question[] {
  const pool: Question[] = []
  const mods = [1, 2, 3, 6, 8, 13, 15, 16, 19, 20]
  for (const m of mods) for (let i = 0; i < 12; i++) pool.push(mkQ(`Q-${m}-${i}`, m))
  pool.push({ ...mkQ('Q-CEHX-1', 1), id: 'Q-CEHX-1', module: 0, domain: 'beyond' })
  pool.push({ ...mkQ('Q-SCEN', 1), id: 'Q-SCEN', type: 'scenario', choices: undefined, answer: 'x' })
  return pool
}

describe('exam / buildExamQuestionIds', () => {
  it('caps at the requested count and returns unique gradable ids', () => {
    const pool = bigPool()
    const preset = EXAM.presets.find((p) => p.id === 'quick')!
    const ids = buildExamQuestionIds(preset, pool)
    expect(ids.length).toBe(preset.count)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('never includes CEH+ (module 0) or scenario questions', () => {
    const pool = bigPool()
    const byId = new Map(pool.map((q) => [q.id, q]))
    const ids = buildExamQuestionIds(EXAM.presets[0], pool)
    for (const id of ids) {
      const q = byId.get(id)!
      expect(q.module).toBeGreaterThanOrEqual(1)
      expect(q.module).toBeLessThanOrEqual(20)
      expect(q.type).not.toBe('scenario')
    }
  })

  it('cannot request more than the gradable pool holds', () => {
    const small = [mkQ('a', 1), mkQ('b', 2), mkQ('c', 3)]
    const ids = buildExamQuestionIds(EXAM.presets[0], small)
    expect(ids.length).toBe(3)
  })
})

describe('exam / gradeExam', () => {
  it('scores correct answers and computes pass/fail against the mark', () => {
    const q1 = mkQ('q1', 1, { answer: 'A' })
    const q2 = mkQ('q2', 2, { answer: 'B' })
    const q3 = mkQ('q3', 3, { answer: 'C' })
    const q4 = mkQ('q4', 6, { answer: 'D' })
    const questions = [q1, q2, q3, q4]

    const session: ExamSession = {
      id: 's', createdAt: 0, preset: 'quick', presetLabel: 'Quick',
      questionIds: ['q1', 'q2', 'q3', 'q4'],
      answers: {
        q1: { chosen: 'A', flagged: false }, // correct
        q2: { chosen: 'A', flagged: false }, // wrong
        q3: { chosen: 'C', flagged: false }, // correct
        q4: { chosen: null, flagged: false }, // unanswered → wrong
      },
      durationSec: 100, startedAt: 0, endedAt: 50000, currentIndex: 0, status: 'submitted',
    }

    const result = gradeExam(session, questions, 50)
    expect(result.total).toBe(4)
    expect(result.correct).toBe(2)
    expect(result.answered).toBe(3)
    expect(result.scorePct).toBe(50)
    expect(result.passed).toBe(true) // 50 >= 50
    expect(gradeExam(session, questions, 75).passed).toBe(false)
    expect(result.timeUsedSec).toBe(50)
  })
})
