import { describe, expect, it } from 'vitest'
import { TRACK_CHALLENGES } from '../data/tracks'
import { TRACKS } from '../data/taxonomy'
import type { ExamResult, Report, TrackKey, TriageFinding } from '../types'
import { blankTriageFinding } from './triage'
import {
  PORTFOLIO_SECTIONS,
  PRIVACY_CHECKLIST,
  buildPortfolio,
  canExportPortfolio,
  placeholderWarnings,
  type PortfolioInput,
} from './portfolio'

const trackNames = Object.fromEntries(Object.entries(TRACKS).map(([key, meta]) => [key, meta.name])) as Record<TrackKey, string>

const report: Report = {
  id: 'r1',
  title: 'Cloud review for realbank.com',
  scope: 'Synthetic lab: Cloud.',
  summary: 'Admin contact was admin@realbank.com and host 8.8.8.8.',
  findings: [
    { id: 'f1', title: 'Wildcard IAM', severity: 'critical', impact: 'Account-wide.', remediation: 'Scope actions; api_key=abcd1234efgh must rotate.', evidence: 'Evidence line from https://realbank.com/policy' },
  ],
  createdAt: 1,
  updatedAt: 1,
}

const exam = { submittedAt: 1, scorePct: 81.2, passed: true } as ExamResult
const triage: TriageFinding = { ...blankTriageFinding(1), title: 'IDOR on invoices', asset: 'api.neoncorp.example', evidence: 'User 1002 read 5581', impact: 'Cross-user read.', remediation: 'Enforce ownership.', status: 'confirmed' }

function input(): PortfolioInput {
  return {
    examResults: [exam, { ...exam, submittedAt: 2, scorePct: 70, passed: false }],
    practicalResults: [],
    reports: [report],
    triageFindings: [triage],
    trackSubmissions: [],
    trackChallenges: TRACK_CHALLENGES,
    trackNames,
    stories: [{ id: 's1', skillId: 'web', kind: 'strength', format: 'star', title: 'Finding an IDOR', situation: 'In a synthetic lab at api.neoncorp.example', task: 'Review access control', action: 'Compared session and owner ids', result: 'Wrote a high finding with a fix', memo: 'I found a broken access control issue.', evidence: ['Web AppSec: Broken Access Control'], createdAt: 1, updatedAt: 1 }],
    reflection: 'Learned to triage before reporting. TODO add next goal.',
    displayName: 'neon-learner',
  }
}

const allSections = PORTFOLIO_SECTIONS.map((section) => section.key)

describe('portfolio exporter', () => {
  it('builds a public-safe Markdown portfolio with placeholders instead of sensitive values', () => {
    const result = buildPortfolio(input(), { publicSafe: true, sections: allSections, reportIds: ['r1'], generatedAt: 0 })
    expect(result.markdown).toContain('# neon-learner — Security Practice Portfolio')
    expect(result.markdown).toContain('- Best score: 81% · latest: 70% · average: 76%')
    expect(result.markdown).toContain('[email-removed]')
    expect(result.markdown).toContain('[ip-removed]')
    expect(result.markdown).toContain('Cloud review for [host-removed]')
    expect(result.markdown).toContain('## Interview Stories')
    expect(result.markdown).toContain('- **Situation:** In a synthetic lab at api.neoncorp.example')
    expect(result.markdown).toContain('api_key=[redacted]')
    expect(result.markdown).not.toContain('Evidence line from')
    expect(result.markdown).not.toContain('User 1002 read 5581')
    expect(result.sensitiveHits).toEqual([])
    expect(result.redactions).toBeGreaterThanOrEqual(4)
    expect(result.placeholderWarnings).toEqual(['Unfinished marker "TODO"'])
  })

  it('keeps evidence in private mode and blocks export while sensitive values remain', () => {
    const result = buildPortfolio(input(), { publicSafe: false, sections: allSections, reportIds: ['r1'], generatedAt: 0 })
    expect(result.markdown).toContain('Evidence line from https://realbank.com/policy')
    expect(result.sensitiveHits.length).toBeGreaterThan(0)
    const gate = canExportPortfolio(result, PRIVACY_CHECKLIST.map(() => true))
    expect(gate.ok).toBe(false)
    expect(gate.reasons[0]).toContain('sensitive value')
  })

  it('requires the full privacy checklist before export', () => {
    const result = buildPortfolio(input(), { publicSafe: true, sections: ['mockExams'], reportIds: [], generatedAt: 0 })
    expect(canExportPortfolio(result, PRIVACY_CHECKLIST.map((_, index) => index > 0)).ok).toBe(false)
    expect(canExportPortfolio(result, PRIVACY_CHECKLIST.map(() => true))).toEqual({ ok: true, reasons: [] })
  })

  it('respects section and report selection', () => {
    const result = buildPortfolio(input(), { publicSafe: true, sections: ['reports'], reportIds: [], generatedAt: 0 })
    expect(result.markdown).toContain('_No reports selected._')
    expect(result.markdown).not.toContain('CEH Mock Exams')
  })

  it('detects template placeholders', () => {
    expect(placeholderWarnings('Hello <your name>, see [insert company] TBD')).toEqual([
      'Unfinished marker "TBD"',
      'Template placeholder "<your name>"',
      'Template placeholder "[insert company]"',
    ])
  })
})
