import type { Attempt, ExamResult, Report, ReviewItem, Severity } from '../types'

export interface LabProgressSummary {
  id: string
  title: string
  category: string
  scopeAcknowledged: boolean
  objectivesDone: number
  objectivesTotal: number
  hintsRevealed: number
}

export interface PublicAnalyticsInput {
  attempts: Attempt[]
  reviews: Record<string, ReviewItem>
  examResults: ExamResult[]
  reports: Report[]
  labProgress: LabProgressSummary[]
  exportedAt?: number
}

export interface PublicAnalyticsExport {
  format: 'neonsec-public-analytics'
  version: 1
  exportedAt: number
  summary: {
    attempts: number
    correct: number
    accuracyPct: number
    reviewItems: number
    dueReviews: number
    mockExams: number
    reports: number
    labsStarted: number
  }
  attemptsByMode: Record<string, number>
  reviewSchedule: {
    dueNow: number
    scheduledFuture: number
    suspended: number
  }
  mockSummaries: Array<{
    preset: string
    submittedAt: number
    scorePct: number
    passed: boolean
    answered: number
    total: number
  }>
  labSummaries: LabProgressSummary[]
  reportSummaries: Array<{
    title: string
    findingCount: number
    severities: Record<Severity, number>
    updatedAt: number
  }>
}

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export function maskSensitiveText(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')
    .replace(/\b(?:password|passwd|pwd|token|secret|api[_-]?key)\s*[:=]\s*\S+/gi, '[secret]')
}

function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

export function buildPublicAnalyticsExport(input: PublicAnalyticsInput): PublicAnalyticsExport {
  const now = input.exportedAt ?? Date.now()
  const attemptsByMode: Record<string, number> = {}
  let correct = 0
  for (const attempt of input.attempts) {
    attemptsByMode[attempt.mode] = (attemptsByMode[attempt.mode] ?? 0) + 1
    if (attempt.correct) correct++
  }

  const reviews = Object.values(input.reviews)
  const dueReviews = reviews.filter((review) => !review.suspended && review.dueAt <= now).length
  const suspended = reviews.filter((review) => review.suspended).length
  const scheduledFuture = reviews.length - dueReviews - suspended
  const labsStarted = input.labProgress.filter((lab) => lab.scopeAcknowledged || lab.objectivesDone > 0 || lab.hintsRevealed > 0).length

  return {
    format: 'neonsec-public-analytics',
    version: 1,
    exportedAt: now,
    summary: {
      attempts: input.attempts.length,
      correct,
      accuracyPct: pct(correct, input.attempts.length),
      reviewItems: reviews.length,
      dueReviews,
      mockExams: input.examResults.length,
      reports: input.reports.length,
      labsStarted,
    },
    attemptsByMode,
    reviewSchedule: {
      dueNow: dueReviews,
      scheduledFuture,
      suspended,
    },
    mockSummaries: input.examResults
      .slice()
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .map((result) => ({
        preset: result.presetLabel,
        submittedAt: result.submittedAt,
        scorePct: Math.round(result.scorePct),
        passed: result.passed,
        answered: result.answered,
        total: result.total,
      })),
    labSummaries: input.labProgress,
    reportSummaries: input.reports.map((report) => {
      const severities = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<Severity, number>
      for (const finding of report.findings) severities[finding.severity]++
      return {
        title: maskSensitiveText(report.title || 'Untitled report'),
        findingCount: report.findings.length,
        severities,
        updatedAt: report.updatedAt,
      }
    }),
  }
}

export function publicAnalyticsToMarkdown(data: PublicAnalyticsExport): string {
  const lines = [
    '# NeonSec Public Progress Summary',
    '',
    `Generated: ${new Date(data.exportedAt).toISOString()}`,
    '',
    '## Privacy Boundary',
    '',
    '- This export contains aggregate learning metrics and masked report titles only.',
    '- It excludes raw answers, custom question text, mistake notes, report evidence, and full backup data.',
    '',
    '## Summary',
    '',
    `- Attempts: ${data.summary.attempts}`,
    `- Correct: ${data.summary.correct}`,
    `- Accuracy: ${data.summary.accuracyPct}%`,
    `- Review items: ${data.summary.reviewItems}`,
    `- Due reviews: ${data.summary.dueReviews}`,
    `- Mock exams: ${data.summary.mockExams}`,
    `- Labs started: ${data.summary.labsStarted}`,
    `- Reports: ${data.summary.reports}`,
    '',
    '## Attempts By Mode',
    '',
  ]

  const modes = Object.entries(data.attemptsByMode)
  if (modes.length === 0) lines.push('_No attempts recorded._')
  else modes.forEach(([mode, count]) => lines.push(`- ${mode}: ${count}`))

  lines.push('', '## Mock Summaries', '')
  if (data.mockSummaries.length === 0) {
    lines.push('_No mock exams recorded._')
  } else {
    data.mockSummaries.forEach((mock) => {
      lines.push(`- ${mock.preset}: ${mock.scorePct}% (${mock.answered}/${mock.total} answered, ${mock.passed ? 'pass' : 'fail'})`)
    })
  }

  lines.push('', '## Lab Summaries', '')
  if (data.labSummaries.length === 0) {
    lines.push('_No lab progress recorded._')
  } else {
    data.labSummaries.forEach((lab) => {
      lines.push(`- ${maskSensitiveText(lab.title)}: ${lab.objectivesDone}/${lab.objectivesTotal} objectives, ${lab.hintsRevealed} hints, scope ${lab.scopeAcknowledged ? 'acknowledged' : 'not acknowledged'}`)
    })
  }

  lines.push('', '## Report Summaries', '')
  if (data.reportSummaries.length === 0) {
    lines.push('_No reports recorded._')
  } else {
    data.reportSummaries.forEach((report) => {
      const severityText = SEVERITIES.map((severity) => `${severity}:${report.severities[severity]}`).join(' ')
      lines.push(`- ${report.title}: ${report.findingCount} findings (${severityText})`)
    })
  }

  lines.push('', '---', 'Safe-use note: this public export is intended for learning progress sharing only.')
  return lines.join('\n')
}
