import type { EvidenceItem, EvidenceType, Finding, Report } from '../types'

export const EVIDENCE_TYPES: readonly EvidenceType[] = [
  'observation',
  'log',
  'screenshot',
  'file',
  'note',
]

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  observation: 'Observation',
  log: 'Log excerpt',
  screenshot: 'Screenshot',
  file: 'File reference',
  note: 'Analyst note',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() : null
}

function positiveTimestamp(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Number.isFinite(new Date(value).getTime()) ? value : null
}

export function isEvidenceType(value: unknown): value is EvidenceType {
  return typeof value === 'string' && EVIDENCE_TYPES.includes(value as EvidenceType)
}

/**
 * Normalizes user-owned evidence loaded from backups or browser persistence.
 * Invalid rows are rejected instead of entering the report-linking graph.
 */
export function normalizeEvidenceItem(value: unknown): EvidenceItem | null {
  if (!isRecord(value)) return null

  const id = cleanString(value.id)
  const challengeId = cleanString(value.challengeId)
  const title = cleanString(value.title)
  const note = cleanString(value.note)
  const source = cleanString(value.source)
  const reference = cleanString(value.reference) ?? ''
  const timestamp = positiveTimestamp(value.timestamp)

  if (!id || !challengeId || !title || !note || !source || !timestamp || !isEvidenceType(value.type)) {
    return null
  }

  const createdAt = positiveTimestamp(value.createdAt) ?? timestamp
  const updatedAt = positiveTimestamp(value.updatedAt) ?? createdAt

  return {
    id,
    challengeId,
    title,
    type: value.type,
    note,
    source,
    reference,
    timestamp,
    createdAt,
    updatedAt,
  }
}

export function normalizeEvidenceItems(value: unknown): EvidenceItem[] {
  if (!Array.isArray(value)) return []

  const byId = new Map<string, EvidenceItem>()
  for (const row of value) {
    const item = normalizeEvidenceItem(row)
    if (item) byId.set(item.id, item)
  }
  return [...byId.values()].sort((a, b) => b.timestamp - a.timestamp)
}

export function evidenceForChallenge(items: EvidenceItem[], challengeId: string): EvidenceItem[] {
  return items
    .filter((item) => item.challengeId === challengeId)
    .sort((a, b) => b.timestamp - a.timestamp)
}

export function linkedEvidenceForFinding(finding: Finding, items: EvidenceItem[]): EvidenceItem[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const seen = new Set<string>()
  return (finding.evidenceIds ?? []).flatMap((id) => {
    if (seen.has(id)) return []
    seen.add(id)
    const item = byId.get(id)
    return item ? [item] : []
  })
}

/**
 * Keeps the report-to-evidence graph valid after imports, persistence hydration,
 * and direct store writes. Challenge reports may only cite evidence owned by the
 * same challenge; standalone reports may cite any existing Vault item.
 */
export function reconcileReportEvidenceLinks(reports: Report[], items: EvidenceItem[]): Report[] {
  const allIds = new Set(items.map((item) => item.id))
  const idsByChallenge = new Map<string, Set<string>>()
  for (const item of items) {
    const ids = idsByChallenge.get(item.challengeId) ?? new Set<string>()
    ids.add(item.id)
    idsByChallenge.set(item.challengeId, ids)
  }

  return reports.map((report) => {
    // Full report validation predates the Vault. Leave malformed legacy rows to
    // the existing report importer, but never throw while reconciling links.
    if (!report || !Array.isArray(report.findings)) return report

    const challengeId = typeof report.challengeId === 'string' && report.challengeId.trim()
      ? report.challengeId.trim()
      : undefined
    const allowedIds = challengeId ? (idsByChallenge.get(challengeId) ?? new Set<string>()) : allIds
    let reportChanged = report.challengeId !== challengeId

    const findings = report.findings.map((finding) => {
      if (!finding || typeof finding !== 'object') return finding

      const current = finding.evidenceIds
      const next: string[] = []
      const seen = new Set<string>()
      if (Array.isArray(current)) {
        for (const value of current) {
          if (typeof value !== 'string' || seen.has(value) || !allowedIds.has(value)) continue
          seen.add(value)
          next.push(value)
        }
      }

      const unchanged = Array.isArray(current)
        && current.length === next.length
        && current.every((value, index) => value === next[index])
      if (unchanged || (current === undefined && next.length === 0)) return finding

      reportChanged = true
      return { ...finding, evidenceIds: next }
    })

    return reportChanged ? { ...report, challengeId, findings } : report
  })
}
