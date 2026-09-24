import type { EvidenceItem, Finding, Report, Severity } from '../types'
import { scanSensitiveText, type SafetyHit } from './contentSafety'
import { linkedEvidenceForFinding } from './evidence'

// ============================================================
// Report Builder (P4-007): section generation and quality checklist.
// ============================================================

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export const REPORT_SECTIONS = [
  'Executive summary',
  'Scope',
  'Methodology',
  'Findings',
  'Remediation plan',
  'Appendix',
] as const

export interface ReportQualityCheck {
  id: string
  label: string
  passed: boolean
  required: boolean
  detail: string
}

export interface ReportSafetyHit extends SafetyHit {
  field: string
}

function filled(value: string | undefined, min: number): boolean {
  return (value ?? '').trim().length >= min
}

export function sortFindingsBySeverity(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
}

function severityCounts(findings: Finding[]): string {
  const parts = SEVERITY_ORDER.flatMap((severity) => {
    const count = findings.filter((finding) => finding.severity === severity).length
    return count > 0 ? [`${count} ${severity}`] : []
  })
  return parts.length > 0 ? parts.join(', ') : 'no findings'
}

/** Drafts an executive summary from the findings; the learner edits it afterwards. */
export function generateExecutiveSummary(report: Pick<Report, 'findings' | 'scope'>): string {
  const findings = sortFindingsBySeverity(report.findings)
  if (findings.length === 0) {
    return 'This synthetic training assessment recorded no findings within the stated scope.'
  }
  const top = findings[0]
  const lines = [
    `This synthetic training assessment identified ${findings.length} finding${findings.length === 1 ? '' : 's'} (${severityCounts(findings)}).`,
    `The highest-risk issue is "${top.title || 'Untitled finding'}" (${top.severity}): ${top.impact || 'impact not yet described'}`,
    `Priority action: ${top.remediation || 'define a remediation for the top finding'}`,
  ]
  return lines.join(' ')
}

/** Builds a remediation roadmap ordered by severity, one line per finding. */
export function generateRemediationPlan(report: Pick<Report, 'findings'>): string {
  const findings = sortFindingsBySeverity(report.findings)
  if (findings.length === 0) return ''
  const bucket = (severity: Severity) => (severity === 'critical' || severity === 'high'
    ? 'Immediate'
    : severity === 'medium' ? 'Short term' : 'Planned')
  return findings
    .map((finding, index) => `${index + 1}. [${bucket(finding.severity)}] ${finding.title || 'Untitled finding'} — ${finding.remediation || 'remediation to be defined'}`)
    .join('\n')
}

/** Every free-text field of the report paired with a label for safety scanning. */
function reportTextFields(report: Report): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['Title', report.title],
    ['Scope', report.scope],
    ['Executive summary', report.summary],
    ['Methodology', report.methodology ?? ''],
    ['Remediation plan', report.remediationPlan ?? ''],
    ['Appendix', report.appendix ?? ''],
  ]
  report.findings.forEach((finding, index) => {
    const label = `Finding ${index + 1}`
    fields.push(
      [`${label} title`, finding.title],
      [`${label} asset`, finding.asset ?? ''],
      [`${label} impact`, finding.impact],
      [`${label} remediation`, finding.remediation],
      [`${label} evidence`, finding.evidence],
    )
  })
  return fields
}

/**
 * Detects real-target and secret material in a report. Reports are learner prose, so only hosts in
 * URLs and emails are checked for domains (file names and code references are allowed).
 */
export function reportSafetyHits(report: Report): ReportSafetyHit[] {
  return reportTextFields(report).flatMap(([field, value]) =>
    scanSensitiveText(value, { domains: 'hosts' }).map((hit) => ({ ...hit, field })))
}

export function reportQualityChecklist(report: Report, evidenceItems: EvidenceItem[]): ReportQualityCheck[] {
  const findings = report.findings
  const incomplete = findings.filter((finding) => !filled(finding.title, 3) || !filled(finding.impact, 10) || !filled(finding.remediation, 10))
  const uncited = findings.filter((finding) => !filled(finding.evidence, 5) && linkedEvidenceForFinding(finding, evidenceItems).length === 0)
  const sorted = sortFindingsBySeverity(findings)
  const ordered = findings.every((finding, index) => finding.severity === sorted[index].severity)
  const safetyHits = reportSafetyHits(report)

  return [
    {
      id: 'summary',
      label: 'Executive summary states the overall risk for a non-technical reader',
      passed: filled(report.summary, 60),
      required: true,
      detail: 'Write at least a few sentences (60+ characters); use "Draft from findings" to start.',
    },
    {
      id: 'scope',
      label: 'Scope is explicit and labelled synthetic / training',
      passed: filled(report.scope, 20) && /synthetic|fictional|training|toy|lab/i.test(report.scope),
      required: true,
      detail: 'Name the provided artifacts and state that the scope is synthetic.',
    },
    {
      id: 'methodology',
      label: 'Methodology explains how the evidence was reviewed',
      passed: filled(report.methodology, 40),
      required: true,
      detail: 'Describe the static review approach and what was out of scope (40+ characters).',
    },
    {
      id: 'findings',
      label: 'At least one finding is recorded',
      passed: findings.length > 0,
      required: true,
      detail: 'Add a finding or import one from a lab, worksheet, or the Triage board.',
    },
    {
      id: 'finding-fields',
      label: 'Every finding has a title, impact, and remediation',
      passed: findings.length > 0 && incomplete.length === 0,
      required: true,
      detail: incomplete.length > 0
        ? `Complete: ${incomplete.map((finding) => finding.title || 'untitled finding').join('; ')}.`
        : 'All findings are complete.',
    },
    {
      id: 'evidence',
      label: 'Every finding cites evidence (note or Evidence Vault link)',
      passed: findings.length > 0 && uncited.length === 0,
      required: true,
      detail: uncited.length > 0
        ? `Add evidence to: ${uncited.map((finding) => finding.title || 'untitled finding').join('; ')}.`
        : 'All findings cite evidence.',
    },
    {
      id: 'remediation-plan',
      label: 'Remediation plan prioritises fixes',
      passed: filled(report.remediationPlan, 40),
      required: true,
      detail: 'Use "Generate from findings" for a severity-ordered roadmap, then edit it.',
    },
    {
      id: 'ordering',
      label: 'Findings are ordered from highest to lowest severity',
      passed: ordered,
      required: false,
      detail: 'Use "Sort by severity" so readers see the biggest risks first.',
    },
    {
      id: 'appendix',
      label: 'Appendix lists artifacts and supporting references',
      passed: filled(report.appendix, 20),
      required: false,
      detail: 'List the synthetic artifacts, Vault references, and assumptions.',
    },
    {
      id: 'safety',
      label: 'No real targets, public IPs, real emails, or credentials',
      passed: safetyHits.length === 0,
      required: true,
      detail: safetyHits.length > 0
        ? `${safetyHits.length} item${safetyHits.length === 1 ? '' : 's'} to remove: ${safetyHits.slice(0, 3).map((hit) => `${hit.field} (${hit.value})`).join('; ')}.`
        : 'No sensitive values detected.',
    },
  ]
}

export function reportQualityScore(checks: ReportQualityCheck[]): { passed: number; total: number; ready: boolean } {
  return {
    passed: checks.filter((check) => check.passed).length,
    total: checks.length,
    ready: checks.every((check) => check.passed || !check.required),
  }
}
