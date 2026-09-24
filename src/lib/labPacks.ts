import type { Lab } from '../data/labs'
import type { InstalledLabPack } from '../types'
import { validateLabRegistry } from './labRegistry'
import { AUDIT_RULESET_VERSION, publishDecision, type PublishDecision } from './labSafetyAudit'

// ============================================================
// Advanced Lab Pack Authoring (P5-010). A lab pack bundles a manifest, lab
// (challenge) definitions with their synthetic assets, and the author's
// safety audit result. Third-party packs are never trusted: the manifest is
// validated, compatibility is checked, and the Lab Safety Audit re-runs
// locally before import. Overrides from pack authors are not accepted.
// ============================================================

export const LAB_PACK_FORMAT = 'neonsec-lab-pack'
export const LAB_PACK_FORMAT_VERSION = 1
export const MAX_PACK_LABS = 25
const MAX_PACK_BYTES = 512_000

export interface LabPackAuditSummary {
  rulesetVersion: number
  auditedAt: string
  results: Array<{ labId: string; status: 'pass' | 'fail'; blockers: number; warnings: number }>
}

export interface LabPackManifest {
  format: typeof LAB_PACK_FORMAT
  formatVersion: number
  id: string
  name: string
  version: string
  minAppVersion: string
  author: string
  license: string
  description: string
  tags?: string[]
  labs: Lab[]
  safetyAudit: LabPackAuditSummary
}

export interface LabPackPreview {
  ok: boolean
  /** Blocking problems: parse, manifest, compatibility, schema, or safety. */
  errors: string[]
  warnings: string[]
  manifest: Partial<LabPackManifest> | null
  decisions: PublishDecision[]
  compatible: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/

export function compareVersions(a: string, b: string): number {
  const pa = a.match(SEMVER)
  const pb = b.match(SEMVER)
  if (!pa || !pb) return Number.NaN
  for (let index = 1; index <= 3; index++) {
    const diff = Number(pa[index]) - Number(pb[index])
    if (diff !== 0) return Math.sign(diff)
  }
  return 0
}

/** Parses, validates, checks compatibility, and re-audits a lab pack without installing it. */
export function previewLabPack(json: string, appVersion: string, existingLabIds: string[] = []): LabPackPreview {
  const errors: string[] = []
  const warnings: string[] = []
  const empty = (message: string): LabPackPreview => ({ ok: false, errors: [message], warnings, manifest: null, decisions: [], compatible: false })

  if (json.length > MAX_PACK_BYTES) return empty(`Pack is larger than ${Math.round(MAX_PACK_BYTES / 1000)} KB.`)
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return empty('Pack is not valid JSON.')
  }
  if (!isRecord(parsed)) return empty('Pack must be a JSON object.')
  const manifest = parsed as Partial<LabPackManifest>

  if (manifest.format !== LAB_PACK_FORMAT) errors.push(`format must be "${LAB_PACK_FORMAT}".`)
  if (manifest.formatVersion !== LAB_PACK_FORMAT_VERSION) errors.push(`formatVersion ${String(manifest.formatVersion)} is not supported (expected ${LAB_PACK_FORMAT_VERSION}).`)
  if (typeof manifest.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,48}$/.test(manifest.id)) errors.push('id must be a lowercase slug (3-49 characters).')
  for (const key of ['name', 'author', 'license', 'description'] as const) {
    if (typeof manifest[key] !== 'string' || !(manifest[key] as string).trim()) errors.push(`${key} is required.`)
  }
  if (typeof manifest.version !== 'string' || !SEMVER.test(manifest.version)) errors.push('version must be semver (MAJOR.MINOR.PATCH).')

  let compatible = false
  if (typeof manifest.minAppVersion !== 'string' || !SEMVER.test(manifest.minAppVersion)) {
    errors.push('minAppVersion must be semver.')
  } else if (compareVersions(manifest.minAppVersion, appVersion) > 0) {
    errors.push(`Pack requires app ${manifest.minAppVersion} or newer (this app is ${appVersion}).`)
  } else {
    compatible = true
  }

  const labs = Array.isArray(manifest.labs) ? manifest.labs.filter(isRecord) as unknown as Lab[] : []
  if (!Array.isArray(manifest.labs) || labs.length === 0) errors.push('labs must contain at least one lab.')
  if (labs.length > MAX_PACK_LABS) errors.push(`A pack may contain at most ${MAX_PACK_LABS} labs.`)

  const audit = manifest.safetyAudit
  if (!isRecord(audit)) {
    errors.push('safetyAudit summary is required; run the Lab Safety Audit before packaging.')
  } else {
    if (audit.rulesetVersion !== AUDIT_RULESET_VERSION) {
      warnings.push(`Pack was audited with ruleset v${String(audit.rulesetVersion)}; it was re-audited locally with v${AUDIT_RULESET_VERSION}.`)
    }
    const results = Array.isArray(audit.results) ? audit.results : []
    for (const lab of labs) {
      if (!results.some((result) => isRecord(result) && result.labId === lab.id)) errors.push(`safetyAudit has no result for lab "${String(lab.id)}".`)
    }
  }

  const decisions: PublishDecision[] = []
  for (const lab of labs) {
    // Pack authors cannot pre-approve their own content: overrides are rejected outright.
    if (isRecord(lab.safetyAudit) && lab.safetyAudit.status === 'override') {
      errors.push(`Lab "${String(lab.id)}" carries a manual override; overrides are not accepted from packs.`)
    }
    if (existingLabIds.includes(String(lab.id))) errors.push(`Lab id "${String(lab.id)}" collides with a shipped lab.`)
    try {
      const decision = publishDecision(lab)
      decisions.push(decision)
      if (!decision.publishable) errors.push(`Lab "${String(lab.id)}" failed the safety audit: ${decision.reasons.join(' ')}`)
      const claimed = isRecord(audit) && Array.isArray(audit.results)
        ? audit.results.find((result) => isRecord(result) && result.labId === lab.id)
        : undefined
      if (isRecord(claimed) && claimed.status === 'pass' && decision.report.computedStatus === 'fail') {
        errors.push(`Lab "${String(lab.id)}" claims a passing audit but fails locally.`)
      }
    } catch {
      errors.push(`Lab "${String(lab.id)}" is malformed and could not be audited.`)
    }
  }

  try {
    for (const problem of validateLabRegistry(labs)) {
      if (problem.kind === 'schema') errors.push(`Lab "${problem.labId}" ${problem.field}: ${problem.message}`)
    }
  } catch {
    errors.push('One or more labs are malformed.')
  }

  const unique = [...new Set(errors)]
  return { ok: unique.length === 0, errors: unique, warnings, manifest, decisions, compatible }
}

export function installedPackFromPreview(preview: LabPackPreview, now = Date.now()): InstalledLabPack | null {
  if (!preview.ok || !preview.manifest) return null
  const manifest = preview.manifest as LabPackManifest
  return {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    author: manifest.author,
    description: manifest.description,
    labs: manifest.labs,
    installedAt: now,
    auditRuleset: AUDIT_RULESET_VERSION,
  }
}
