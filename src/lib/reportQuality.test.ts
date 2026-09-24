import { describe, expect, it } from 'vitest'
import { labById } from '../data/labs'
import type { Report } from '../types'
import { createLabReport } from './labReport'
import { reportToMarkdown } from './reportMarkdown'
import {
  generateExecutiveSummary,
  generateRemediationPlan,
  reportQualityChecklist,
  reportQualityScore,
  reportSafetyHits,
  sortFindingsBySeverity,
} from './reportQuality'

const lab = labById('cloud-iam')!

function completeReport(): Report {
  const report = createLabReport(lab, 1_000)
  const findings = report.findings.map((finding) => ({ ...finding, evidence: 'Cited from role-policy.json lines 3-5.' }))
  const drafted = { ...report, findings }
  return {
    ...drafted,
    summary: generateExecutiveSummary(drafted),
    remediationPlan: generateRemediationPlan(drafted),
  }
}

describe('report builder quality', () => {
  it('creates lab reports with every section and passes the checklist once completed', () => {
    const report = completeReport()
    expect(report.methodology).toContain('Static, read-only review')
    expect(report.appendix).toContain('Synthetic artifacts reviewed')
    const checks = reportQualityChecklist(report, [])
    expect(checks.filter((check) => !check.passed).map((check) => check.id)).toEqual([])
    expect(reportQualityScore(checks)).toEqual({ passed: checks.length, total: checks.length, ready: true })
  })

  it('reports each failing check for an empty report', () => {
    const empty: Report = { id: 'r', title: '', scope: '', summary: '', findings: [], createdAt: 1, updatedAt: 1 }
    const failed = reportQualityChecklist(empty, []).filter((check) => !check.passed).map((check) => check.id)
    expect(failed).toEqual(['summary', 'scope', 'methodology', 'findings', 'finding-fields', 'evidence', 'remediation-plan', 'appendix'])
    expect(reportQualityScore(reportQualityChecklist(empty, [])).ready).toBe(false)
  })

  it('generates severity-ordered summary and remediation sections from findings', () => {
    const report = createLabReport(lab, 1_000)
    const reversed = { ...report, findings: [...report.findings].reverse() }
    expect(sortFindingsBySeverity(reversed.findings).map((finding) => finding.severity)).toEqual(['critical', 'high'])
    expect(generateExecutiveSummary(reversed)).toContain('2 findings (1 critical, 1 high)')
    const plan = generateRemediationPlan(reversed).split('\n')
    expect(plan[0]).toMatch(/^1\. \[Immediate\] Wildcard IAM permissions/)
    expect(reportQualityChecklist(reversed, []).find((check) => check.id === 'ordering')?.passed).toBe(false)
  })

  it('flags real targets and credentials anywhere in the report', () => {
    const report = { ...completeReport(), appendix: 'Compared with https://realbank.com and 8.8.8.8; api_key=abcd1234efgh' }
    const hits = reportSafetyHits(report)
    expect(hits.map((hit) => hit.kind)).toEqual(['public-ip', 'live-url', 'credential'])
    expect(hits.every((hit) => hit.field === 'Appendix')).toBe(true)
    expect(reportQualityChecklist(report, []).find((check) => check.id === 'safety')?.passed).toBe(false)
  })

  it('exports every report section to Markdown', () => {
    const markdown = reportToMarkdown(completeReport(), [])
    for (const heading of ['## Executive Summary', '## Scope', '## Methodology', '## Findings', '## Remediation Plan', '## Appendix']) {
      expect(markdown).toContain(heading)
    }
  })
})
