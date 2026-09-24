import type { Lab, WebConceptKey } from '../data/labs'
import type { Finding, LabWorksheet, Severity } from '../types'
import { uid } from './id'

export interface WebConceptMeta {
  label: string
  focus: string
}

/** Web security concepts taught through static request/response labs (P4-005). */
export const WEB_CONCEPTS: Record<WebConceptKey, WebConceptMeta> = {
  'access-control': {
    label: 'Broken access control',
    focus: 'Object- and function-level authorization enforced on the server.',
  },
  'input-validation': {
    label: 'Input validation',
    focus: 'Keeping input as data: parameterization, validation, and safe errors.',
  },
  session: {
    label: 'Session management',
    focus: 'Identifier rotation, invalidation, cookie attributes, and timeouts.',
  },
  'security-headers': {
    label: 'Security headers',
    focus: 'Browser-enforced protections: framing, CSP, HSTS, and content sniffing.',
  },
}

export const WEB_CONCEPT_KEYS = Object.keys(WEB_CONCEPTS) as WebConceptKey[]

export function isWebConcept(value: unknown): value is WebConceptKey {
  return typeof value === 'string' && WEB_CONCEPT_KEYS.includes(value as WebConceptKey)
}

export const WORKSHEET_FIELDS = ['finding', 'impact', 'remediation'] as const
export type WorksheetField = (typeof WORKSHEET_FIELDS)[number]
export const WORKSHEET_MIN_LENGTH = 20
const WORKSHEET_MAX_LENGTH = 4000

export const WORKSHEET_LABELS: Record<WorksheetField, string> = {
  finding: 'Finding',
  impact: 'Impact',
  remediation: 'Remediation',
}

export function worksheetStatus(worksheet: Pick<LabWorksheet, WorksheetField> | undefined): {
  complete: boolean
  missing: WorksheetField[]
} {
  const missing = WORKSHEET_FIELDS.filter((field) => (worksheet?.[field] ?? '').trim().length < WORKSHEET_MIN_LENGTH)
  return { complete: missing.length === 0, missing }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim().slice(0, WORKSHEET_MAX_LENGTH) : ''
}

/** Keeps one worksheet per known lab; unknown labs and malformed rows are dropped. */
export function normalizeLabWorksheets(value: unknown, labs: Lab[]): LabWorksheet[] {
  if (!Array.isArray(value)) return []
  const known = new Set(labs.map((lab) => lab.id))
  const byLab = new Map<string, LabWorksheet>()
  for (const row of value) {
    if (!isRecord(row) || typeof row.labId !== 'string' || !known.has(row.labId)) continue
    const updatedAt = typeof row.updatedAt === 'number' && Number.isFinite(row.updatedAt) && row.updatedAt > 0
      ? row.updatedAt
      : null
    if (!updatedAt) continue
    const worksheet: LabWorksheet = {
      labId: row.labId,
      finding: cleanText(row.finding),
      impact: cleanText(row.impact),
      remediation: cleanText(row.remediation),
      updatedAt,
    }
    const previous = byLab.get(worksheet.labId)
    if (!previous || previous.updatedAt <= worksheet.updatedAt) byLab.set(worksheet.labId, worksheet)
  }
  return [...byLab.values()].sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Converts a complete learner worksheet into a report finding. */
export function worksheetToFinding(worksheet: LabWorksheet, lab: Lab, severity: Severity): Finding {
  const firstLine = worksheet.finding.split('\n')[0].trim()
  const title = firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine
  return {
    id: uid('f-'),
    title,
    severity,
    impact: worksheet.impact,
    remediation: worksheet.remediation,
    evidence: `Learner worksheet for ${lab.title}: ${worksheet.finding}`,
    evidenceIds: [],
  }
}
