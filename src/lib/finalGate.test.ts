import { describe, expect, it } from 'vitest'
import type { ExamResult, ModuleStat } from '../types'
import { evaluateFinalGate, finalGateToMarkdown } from './finalGate'

const mockResult = (scorePct: number, submittedAt: number): ExamResult => ({
  sessionId: `s-${submittedAt}`,
  preset: 'full',
  presetLabel: 'Full Exam',
  submittedAt,
  total: 125,
  answered: 125,
  correct: Math.round((scorePct / 100) * 125),
  scorePct,
  passMark: 85,
  passed: scorePct >= 85,
  perDomain: [],
  timeUsedSec: 0,
  durationSec: 0,
  questionIds: [],
  answers: {},
})

const mod = (module: number, patch: Partial<ModuleStat> = {}): ModuleStat => ({
  module,
  moduleName: `Module ${module}`,
  domain: 'overview',
  district: 'gate',
  total: 4,
  seen: 4,
  correct: 4,
  attempts: 4,
  accuracy: 1,
  dueCount: 0,
  mastery: 0.8,
  ...patch,
})

describe('final gate', () => {
  it('passes when all configured gates are satisfied', () => {
    const report = evaluateFinalGate({
      results: [mockResult(86, 1), mockResult(88, 2), mockResult(90, 3)],
      modules: Array.from({ length: 20 }, (_, i) => mod(i + 1)),
      dueBacklog: 0,
      now: 100,
    })

    expect(report.passed).toBe(true)
    expect(report.nextActions).toHaveLength(0)
    expect(report.checks.every((c) => c.passed)).toBe(true)
  })

  it('fails closed when recent mocks, due backlog, and module coverage are insufficient', () => {
    const report = evaluateFinalGate({
      results: [mockResult(90, 1), mockResult(84, 3), mockResult(92, 2)],
      modules: [
        mod(1, { mastery: 0.5 }),
        mod(2, { total: 0, seen: 0, correct: 0, attempts: 0, accuracy: -1, mastery: 0 }),
        mod(3, { seen: 0, correct: 0, attempts: 0, accuracy: -1, mastery: 0 }),
      ],
      dueBacklog: 4,
      now: 100,
    })

    expect(report.passed).toBe(false)
    expect(report.nextActions.length).toBeGreaterThanOrEqual(4)
    expect(report.checks.find((c) => c.id === 'mock-streak')?.passed).toBe(false)
    expect(report.checks.find((c) => c.id === 'due-backlog')?.passed).toBe(false)
    expect(report.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: 2, reason: 'missing' }),
        expect.objectContaining({ module: 3, reason: 'unanswered' }),
      ]),
    )
  })

  it('exports the checklist and next actions as Markdown', () => {
    const report = evaluateFinalGate({
      results: [mockResult(82, 1)],
      modules: [mod(1, { mastery: 0.4 })],
      dueBacklog: 2,
      now: 0,
    })
    const markdown = finalGateToMarkdown(report)

    expect(markdown).toContain('# CEH Final Gate Checklist')
    expect(markdown).toContain('Overall: **FAIL**')
    expect(markdown).toContain('## Next Actions')
    expect(markdown).toContain('Consecutive mock scores')
  })
})
