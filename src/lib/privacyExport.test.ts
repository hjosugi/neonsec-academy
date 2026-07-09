import { describe, expect, it } from 'vitest'
import type { Attempt, Report, ReviewItem } from '../types'
import { buildPublicAnalyticsExport, maskSensitiveText, publicAnalyticsToMarkdown } from './privacyExport'

const attempt = (id: string, correct: boolean, mode: Attempt['mode']): Attempt => ({
  id,
  questionId: 'Q-' + id,
  at: 100,
  correct,
  chosen: 'A',
  mode,
})

const review: ReviewItem = {
  questionId: 'Q-1',
  ease: 2.5,
  intervalDays: 1,
  reps: 1,
  lapses: 0,
  dueAt: 50,
  lastResult: 'correct',
  lastReviewed: 0,
  confidence: 3,
  suspended: false,
}

const report: Report = {
  id: 'r1',
  title: 'Report for alice@example.com from 203.0.113.10',
  scope: 'Private scope text',
  summary: 'Contains private customer details',
  findings: [
    {
      id: 'f1',
      title: 'Token leak',
      severity: 'high',
      impact: 'token=abc123',
      remediation: 'Rotate it',
      evidence: 'password=synthetic-test-value',
    },
  ],
  createdAt: 1,
  updatedAt: 2,
}

describe('privacy export', () => {
  it('masks common sensitive patterns', () => {
    expect(maskSensitiveText('admin@example.com 198.51.100.2 api_key=abc123')).toBe('[email] [ip] [secret]')
  })

  it('builds aggregate public analytics without raw answers or report evidence', () => {
    const data = buildPublicAnalyticsExport({
      attempts: [attempt('1', true, 'practice'), attempt('2', false, 'exam')],
      reviews: { 'Q-1': review },
      examResults: [],
      reports: [report],
      labProgress: [{ id: 'lab', title: 'Synthetic lab', category: 'SOC', scopeAcknowledged: true, objectivesDone: 2, objectivesTotal: 4, hintsRevealed: 1 }],
      exportedAt: 100,
    })
    const markdown = publicAnalyticsToMarkdown(data)

    expect(data.summary.accuracyPct).toBe(50)
    expect(data.attemptsByMode.practice).toBe(1)
    expect(data.reviewSchedule.dueNow).toBe(1)
    expect(markdown).toContain('[email]')
    expect(markdown).toContain('[ip]')
    expect(markdown).not.toContain('synthetic-test-value')
    expect(markdown).not.toContain('abc123')
    expect(markdown).not.toContain('Private scope text')
  })
})
