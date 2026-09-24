import type {
  Finding,
  FindingStatus,
  FixPriority,
  ImpactRating,
  Likelihood,
  Report,
  Severity,
  TriageFinding,
} from '../types'
import { uid } from './id'

// ============================================================
// Vulnerability triage (P4-006): risk rubric, status flow, and
// report hand-off for synthetic findings.
// ============================================================

export const IMPACT_RATINGS: ImpactRating[] = ['minimal', 'moderate', 'significant', 'severe']
export const LIKELIHOODS: Likelihood[] = ['unlikely', 'possible', 'likely', 'almost-certain']
export const FINDING_STATUSES: FindingStatus[] = ['open', 'confirmed', 'false-positive', 'accepted-risk', 'fixed']
export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export const IMPACT_LABELS: Record<ImpactRating, string> = {
  minimal: 'Minimal — negligible data or service effect',
  moderate: 'Moderate — limited data or one user affected',
  significant: 'Significant — sensitive data or many users affected',
  severe: 'Severe — full compromise or business-critical outage',
}

export const LIKELIHOOD_LABELS: Record<Likelihood, string> = {
  unlikely: 'Unlikely — needs rare conditions or insider access',
  possible: 'Possible — needs some access or user interaction',
  likely: 'Likely — reachable by any authenticated user',
  'almost-certain': 'Almost certain — reachable anonymously, easy to trigger',
}

export const STATUS_LABELS: Record<FindingStatus, string> = {
  open: 'Open',
  confirmed: 'Confirmed',
  'false-positive': 'False positive',
  'accepted-risk': 'Accepted risk',
  fixed: 'Fixed',
}

/** Allowed status transitions. Terminal-looking states can be re-opened with a reason. */
export const STATUS_FLOW: Record<FindingStatus, FindingStatus[]> = {
  open: ['confirmed', 'false-positive'],
  confirmed: ['accepted-risk', 'fixed', 'open'],
  'false-positive': ['open'],
  'accepted-risk': ['confirmed', 'fixed'],
  fixed: ['confirmed'],
}

/** Statuses that must carry a justification note. */
export const NOTE_REQUIRED: FindingStatus[] = ['false-positive', 'accepted-risk', 'fixed']

export function riskScore(impact: ImpactRating, likelihood: Likelihood): number {
  return (IMPACT_RATINGS.indexOf(impact) + 1) * (LIKELIHOODS.indexOf(likelihood) + 1)
}

/** Rubric severity from a 4x4 impact × likelihood matrix (score 1-16). */
export function rubricSeverity(impact: ImpactRating, likelihood: Likelihood): Severity {
  const score = riskScore(impact, likelihood)
  if (score >= 12) return 'critical'
  if (score >= 8) return 'high'
  if (score >= 4) return 'medium'
  if (score >= 2) return 'low'
  return 'info'
}

/** Fix priority from effective severity and status; closed findings drop out of the fix queue. */
export function fixPriority(finding: Pick<TriageFinding, 'severity' | 'status'>): FixPriority {
  if (finding.status === 'false-positive' || finding.status === 'fixed') return 'none'
  if (finding.status === 'accepted-risk') return 'P4'
  switch (finding.severity) {
    case 'critical':
      return 'P1'
    case 'high':
      return 'P2'
    case 'medium':
      return 'P3'
    default:
      return 'P4'
  }
}

export function effectiveSeverity(finding: Pick<TriageFinding, 'severityMode' | 'severity' | 'impactRating' | 'likelihood'>): Severity {
  return finding.severityMode === 'rubric' ? rubricSeverity(finding.impactRating, finding.likelihood) : finding.severity
}

export function severityDeviation(finding: Pick<TriageFinding, 'severity' | 'impactRating' | 'likelihood'>): number {
  const rubric = rubricSeverity(finding.impactRating, finding.likelihood)
  return SEVERITIES.indexOf(rubric) - SEVERITIES.indexOf(finding.severity)
}

export interface TriageValidation {
  ok: boolean
  errors: string[]
}

export function validateTriageFinding(finding: TriageFinding): TriageValidation {
  const errors: string[] = []
  if (!finding.title.trim()) errors.push('Title is required.')
  if (!finding.asset.trim()) errors.push('Affected asset is required.')
  if (!finding.evidence.trim() && (finding.evidenceIds ?? []).length === 0) errors.push('Evidence is required.')
  if (!finding.impact.trim()) errors.push('Impact is required.')
  if (!finding.remediation.trim() && finding.status !== 'false-positive') errors.push('Remediation is required.')
  if (NOTE_REQUIRED.includes(finding.status) && !finding.statusNote?.trim()) {
    errors.push(`${STATUS_LABELS[finding.status]} needs a justification note.`)
  }
  return { ok: errors.length === 0, errors }
}

export function canTransition(from: FindingStatus, to: FindingStatus): boolean {
  return from === to || STATUS_FLOW[from].includes(to)
}

/**
 * Applies a status change when the flow allows it and any required note is present.
 * Returns null for an invalid transition.
 */
export function transitionStatus(
  finding: TriageFinding,
  to: FindingStatus,
  note: string,
  now = Date.now(),
): TriageFinding | null {
  if (!canTransition(finding.status, to)) return null
  const clean = note.trim()
  if (NOTE_REQUIRED.includes(to) && !clean) return null
  if (finding.status === to && clean === (finding.statusNote ?? '')) return finding
  return {
    ...finding,
    status: to,
    statusNote: clean || undefined,
    history: [...finding.history, { from: finding.status, to, note: clean, at: now }],
    updatedAt: now,
  }
}

export function blankTriageFinding(now = Date.now()): TriageFinding {
  return {
    id: uid('tf-'),
    title: '',
    asset: '',
    evidence: '',
    evidenceIds: [],
    impact: '',
    impactRating: 'moderate',
    likelihood: 'possible',
    severity: rubricSeverity('moderate', 'possible'),
    severityMode: 'rubric',
    remediation: '',
    status: 'open',
    history: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Copies a triaged finding into report shape, carrying triage context for export. */
export function triageToReportFinding(finding: TriageFinding): Finding {
  return {
    id: uid('f-'),
    title: finding.title,
    severity: effectiveSeverity(finding),
    impact: finding.impact,
    remediation: finding.remediation,
    evidence: finding.evidence,
    evidenceIds: [...(finding.evidenceIds ?? [])],
    asset: finding.asset,
    likelihood: finding.likelihood,
    status: finding.status,
    triageId: finding.id,
  }
}

/** Adds (or refreshes) a triaged finding in a report without duplicating it. */
export function addTriageFindingToReport(report: Report, finding: TriageFinding, now = Date.now()): Report {
  const next = triageToReportFinding(finding)
  const index = report.findings.findIndex((item) => item.triageId === finding.id)
  const findings = [...report.findings]
  if (index >= 0) findings[index] = { ...next, id: findings[index].id }
  else findings.push(next)
  return { ...report, findings, updatedAt: now }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, max = 4000): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback
}

function timestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

/** Normalizes triage rows from backups or persisted state; invalid rows are dropped. */
export function normalizeTriageFindings(value: unknown): TriageFinding[] {
  if (!Array.isArray(value)) return []
  const byId = new Map<string, TriageFinding>()
  for (const row of value) {
    if (!isRecord(row)) continue
    const id = text(row.id, 80)
    const title = text(row.title, 200)
    const createdAt = timestamp(row.createdAt)
    if (!id || !title || !createdAt) continue
    const impactRating = pick(row.impactRating, IMPACT_RATINGS, 'moderate')
    const likelihood = pick(row.likelihood, LIKELIHOODS, 'possible')
    const history = Array.isArray(row.history)
      ? row.history.flatMap((entry) => {
        if (!isRecord(entry)) return []
        const at = timestamp(entry.at)
        if (!at) return []
        return [{
          from: pick(entry.from, FINDING_STATUSES, 'open'),
          to: pick(entry.to, FINDING_STATUSES, 'open'),
          note: text(entry.note, 1000),
          at,
        }]
      })
      : []
    byId.set(id, {
      id,
      title,
      asset: text(row.asset, 200),
      evidence: text(row.evidence),
      evidenceIds: Array.isArray(row.evidenceIds) ? row.evidenceIds.filter((item): item is string => typeof item === 'string') : [],
      impact: text(row.impact),
      impactRating,
      likelihood,
      severity: pick(row.severity, SEVERITIES, rubricSeverity(impactRating, likelihood)),
      severityMode: row.severityMode === 'manual' ? 'manual' : 'rubric',
      remediation: text(row.remediation),
      status: pick(row.status, FINDING_STATUSES, 'open'),
      statusNote: text(row.statusNote, 1000) || undefined,
      sourceLabId: text(row.sourceLabId, 80) || undefined,
      history,
      createdAt,
      updatedAt: timestamp(row.updatedAt) ?? createdAt,
    })
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt)
}

export interface TriageSummary {
  total: number
  byStatus: Record<FindingStatus, number>
  bySeverity: Record<Severity, number>
  fixQueue: TriageFinding[]
}

const PRIORITY_ORDER: FixPriority[] = ['P1', 'P2', 'P3', 'P4', 'none']

export function summarizeTriage(findings: TriageFinding[]): TriageSummary {
  const byStatus = Object.fromEntries(FINDING_STATUSES.map((status) => [status, 0])) as Record<FindingStatus, number>
  const bySeverity = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<Severity, number>
  for (const finding of findings) {
    byStatus[finding.status]++
    bySeverity[effectiveSeverity(finding)]++
  }
  const fixQueue = findings
    .filter((finding) => finding.status === 'open' || finding.status === 'confirmed')
    .sort((a, b) =>
      PRIORITY_ORDER.indexOf(fixPriority({ ...a, severity: effectiveSeverity(a) }))
        - PRIORITY_ORDER.indexOf(fixPriority({ ...b, severity: effectiveSeverity(b) }))
      || riskScore(b.impactRating, b.likelihood) - riskScore(a.impactRating, a.likelihood))
  return { total: findings.length, byStatus, bySeverity, fixQueue }
}
