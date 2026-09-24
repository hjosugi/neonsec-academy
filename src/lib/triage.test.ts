import { describe, expect, it } from 'vitest'
import type { Report, TriageFinding } from '../types'
import {
  addTriageFindingToReport,
  blankTriageFinding,
  canTransition,
  effectiveSeverity,
  fixPriority,
  normalizeTriageFindings,
  rubricSeverity,
  severityDeviation,
  summarizeTriage,
  transitionStatus,
  validateTriageFinding,
} from './triage'

function finding(patch: Partial<TriageFinding> = {}): TriageFinding {
  return {
    ...blankTriageFinding(1_000),
    id: 'tf-1',
    title: 'Invoice endpoint lacks ownership check',
    asset: 'api.neoncorp.example /api/invoices',
    evidence: 'User 1002 received invoice 5581 owned by user 1007.',
    impact: 'Any user can read other users invoices.',
    remediation: 'Enforce object-level authorization on the server.',
    ...patch,
  }
}

describe('triage rubric', () => {
  it('maps impact × likelihood to severity', () => {
    expect(rubricSeverity('severe', 'almost-certain')).toBe('critical')
    expect(rubricSeverity('significant', 'likely')).toBe('high')
    expect(rubricSeverity('moderate', 'possible')).toBe('medium')
    expect(rubricSeverity('minimal', 'possible')).toBe('low')
    expect(rubricSeverity('minimal', 'unlikely')).toBe('info')
  })

  it('combines manual override with the rubric and reports deviation', () => {
    const manual = finding({ severityMode: 'manual', severity: 'low', impactRating: 'severe', likelihood: 'likely' })
    expect(effectiveSeverity(manual)).toBe('low')
    expect(effectiveSeverity({ ...manual, severityMode: 'rubric' })).toBe('critical')
    expect(severityDeviation(manual)).toBe(-3)
  })

  it('derives fix priority from severity and status', () => {
    expect(fixPriority({ severity: 'critical', status: 'confirmed' })).toBe('P1')
    expect(fixPriority({ severity: 'medium', status: 'open' })).toBe('P3')
    expect(fixPriority({ severity: 'critical', status: 'accepted-risk' })).toBe('P4')
    expect(fixPriority({ severity: 'high', status: 'fixed' })).toBe('none')
    expect(fixPriority({ severity: 'high', status: 'false-positive' })).toBe('none')
  })
})

describe('triage status flow', () => {
  it('allows only defined transitions and requires notes for closing states', () => {
    expect(canTransition('open', 'fixed')).toBe(false)
    expect(transitionStatus(finding(), 'fixed', 'patched')).toBeNull()
    expect(transitionStatus(finding(), 'false-positive', ' ')).toBeNull()

    const confirmed = transitionStatus(finding(), 'confirmed', '', 2_000)!
    expect(confirmed.status).toBe('confirmed')
    const accepted = transitionStatus(confirmed, 'accepted-risk', 'Owner accepts until Q4 with WAF rule.', 3_000)!
    expect(accepted).toMatchObject({ status: 'accepted-risk', statusNote: 'Owner accepts until Q4 with WAF rule.', updatedAt: 3_000 })
    expect(accepted.history.map((entry) => `${entry.from}>${entry.to}`)).toEqual(['open>confirmed', 'confirmed>accepted-risk'])
  })

  it('validates required triage fields', () => {
    expect(validateTriageFinding(finding()).ok).toBe(true)
    const invalid = validateTriageFinding(finding({ asset: '', evidence: '', status: 'accepted-risk' }))
    expect(invalid.errors).toEqual([
      'Affected asset is required.',
      'Evidence is required.',
      'Accepted risk needs a justification note.',
    ])
  })
})

describe('triage report hand-off', () => {
  it('adds a finding once and refreshes it on re-add', () => {
    const report: Report = { id: 'r-1', title: 'R', scope: 'S', summary: '', findings: [], createdAt: 1, updatedAt: 1 }
    const first = addTriageFindingToReport(report, finding({ status: 'confirmed' }), 5)
    expect(first.findings).toHaveLength(1)
    expect(first.findings[0]).toMatchObject({
      triageId: 'tf-1',
      asset: 'api.neoncorp.example /api/invoices',
      status: 'confirmed',
      severity: 'medium',
    })
    const again = addTriageFindingToReport(first, finding({ status: 'fixed', statusNote: 'Verified.' }), 6)
    expect(again.findings).toHaveLength(1)
    expect(again.findings[0]).toMatchObject({ id: first.findings[0].id, status: 'fixed' })
  })

  it('normalizes imported rows and summarizes the fix queue', () => {
    const rows = normalizeTriageFindings([
      finding({ id: 'a', impactRating: 'severe', likelihood: 'likely', status: 'confirmed' }),
      finding({ id: 'b', status: 'fixed' }),
      { ...finding({ id: 'c' }), status: 'bogus', likelihood: 'never' },
      { id: 'd', title: '', createdAt: 1 },
      null,
    ])
    expect(rows.map((row) => row.id).sort()).toEqual(['a', 'b', 'c'])
    expect(rows.find((row) => row.id === 'c')).toMatchObject({ status: 'open', likelihood: 'possible' })

    const summary = summarizeTriage(rows)
    expect(summary.byStatus).toMatchObject({ open: 1, confirmed: 1, fixed: 1 })
    expect(summary.fixQueue.map((row) => row.id)).toEqual(['a', 'c'])
  })
})
