import type { Lab } from '../data/labs'
import type { EvidenceItem, Report } from '../types'
import { uid } from './id'

export function labReportTitle(lab: Pick<Lab, 'title'>): string {
  return `Report — ${lab.title}`
}

export function labReportScope(lab: Pick<Lab, 'category' | 'scope'>): string {
  return `Synthetic lab: ${lab.category}. Allowed: ${lab.scope.allowed.join('; ')}.`
}

type ReportIdentity = Pick<Report, 'title' | 'scope' | 'summary'> & { challengeId?: string }

/** Matches reports created before `challengeId` existed by their generated title/scope. */
export function isReportForLab(report: ReportIdentity, lab: Lab): boolean {
  return report.challengeId === lab.id
    || report.title === labReportTitle(lab)
    || (report.scope === labReportScope(lab) && report.summary === lab.brief)
}

export function findLabReport<T extends ReportIdentity>(reports: T[], lab: Lab): T | undefined {
  return reports.find((report) => report.challengeId === lab.id) ?? reports.find((report) => isReportForLab(report, lab))
}

/** Seeds a lab report from the lab's model findings so the learner edits rather than starts blank. */
export function createLabReport(lab: Lab, now = Date.now()): Report {
  return {
    id: uid('r-'),
    challengeId: lab.id,
    title: labReportTitle(lab),
    scope: labReportScope(lab),
    summary: lab.brief,
    findings: lab.modelFindings.map((finding) => ({ id: uid('f-'), evidence: '', evidenceIds: [], ...finding })),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Adds an Evidence Vault citation to one finding (the first by default). Returns the same
 * report object when the citation already exists or no finding can hold it.
 */
export function citeEvidenceInReport(report: Report, evidenceId: string, findingId?: string, now = Date.now()): Report {
  const target = findingId
    ? report.findings.find((finding) => finding.id === findingId)
    : report.findings[0]
  if (!target || (target.evidenceIds ?? []).includes(evidenceId)) return report
  return {
    ...report,
    challengeId: report.challengeId,
    findings: report.findings.map((finding) => finding === target
      ? { ...finding, evidenceIds: [...(finding.evidenceIds ?? []), evidenceId] }
      : finding),
    updatedAt: now,
  }
}

/** Sorted, de-duplicated, 1-based line numbers that exist in the artifact. */
export function normalizeLineSelection(lines: number[], lineCount: number): number[] {
  return [...new Set(lines.filter((line) => Number.isInteger(line) && line >= 1 && line <= lineCount))]
    .sort((a, b) => a - b)
}

/** Compact line reference: [3, 4, 5, 9] -> `L3-L5, L9`. */
export function formatLineRange(lines: number[]): string {
  const sorted = [...new Set(lines)].sort((a, b) => a - b)
  const parts: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let index = 1; index <= sorted.length; index++) {
    const line = sorted[index]
    if (line === prev + 1) {
      prev = line
      continue
    }
    if (start !== undefined) parts.push(start === prev ? `L${start}` : `L${start}-L${prev}`)
    start = line
    prev = line
  }
  return parts.join(', ')
}

/** Builds a log-excerpt Evidence Vault item from selected lines of a lab's synthetic artifact. */
export function evidenceFromLabLines(lab: Lab, selected: number[], now = Date.now()): EvidenceItem | null {
  const artifactLines = lab.evidence.split('\n')
  const lines = normalizeLineSelection(selected, artifactLines.length)
  if (lines.length === 0) return null
  const range = formatLineRange(lines)
  return {
    id: uid('ev-'),
    challengeId: lab.id,
    title: `${lab.evidenceTitle} ${range}`,
    type: 'log',
    note: lines.map((line) => `L${line}: ${artifactLines[line - 1].trim()}`).join('\n'),
    source: lab.evidenceTitle,
    reference: `${lab.evidenceTitle} ${range}`,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  }
}
