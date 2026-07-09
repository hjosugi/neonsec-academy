import { describe, expect, it } from 'vitest'
import type { ExamResult } from '../types'
import { mkQ } from './testfixtures'
import {
  buildExamStudyPlan,
  examResultToMarkdown,
  getExamModuleScores,
  getFlaggedSummary,
} from './examReport'

const result: ExamResult = {
  sessionId: 's1',
  preset: 'quick',
  presetLabel: 'Quick Sim',
  submittedAt: 1000,
  total: 4,
  answered: 4,
  correct: 2,
  scorePct: 50,
  passMark: 70,
  passed: false,
  perDomain: [],
  timeUsedSec: 1800,
  durationSec: 2700,
  questionIds: ['q1', 'q2', 'q3', 'q4'],
  answers: { q1: 'A', q2: 'A', q3: 'C', q4: 'A' },
  flagged: { q2: true, q3: true },
}

const questions = [
  mkQ('q1', 1, { answer: 'A' }),
  mkQ('q2', 2, { answer: 'B' }),
  mkQ('q3', 2, { answer: 'C' }),
  mkQ('q4', 6, { answer: 'D' }),
]

describe('exam report', () => {
  it('derives module scores for legacy results without perModule data', () => {
    const modules = getExamModuleScores(result, questions)

    expect(modules.map((m) => [m.module, m.total, m.correct])).toEqual([
      [1, 1, 1],
      [2, 2, 1],
      [6, 1, 0],
    ])
  })

  it('computes flagged accuracy from stored flags', () => {
    expect(getFlaggedSummary(result, questions)).toEqual({ total: 2, correct: 1, pct: 50 })
  })

  it('builds a seven-day repair plan from weak modules', () => {
    const plan = buildExamStudyPlan(result, questions)

    expect(plan).toHaveLength(7)
    expect(plan[0].detail).toContain('2 incorrect')
    expect(plan.some((item) => item.title.includes('M06'))).toBe(true)
  })

  it('exports score, margin, module breakdown, and plan as Markdown', () => {
    const markdown = examResultToMarkdown(result, questions, 0)

    expect(markdown).toContain('# Mock Exam Result Report')
    expect(markdown).toContain('Safety margin: -20 pts')
    expect(markdown).toContain('| M02 Footprinting and Reconnaissance | 50% (1/2) | review |')
    expect(markdown).toContain('## Next 7 Days')
  })
})
