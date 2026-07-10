import type { FlagChallengeAssetKind, Lab, LabKind } from '../data/labs'
import { canonicalFlag, isExpectedFlagValid } from './flagChallenge'

export const LAB_KINDS: LabKind[] = ['local', 'dataset', 'simulated', 'writeup']
export const FLAG_ASSET_KINDS: FlagChallengeAssetKind[] = [
  'log',
  'config',
  'request-response',
  'capture',
  'headers',
  'architecture',
]

export interface LabRegistryError {
  labId: string
  field: string
  kind: 'schema' | 'public-ip' | 'real-email' | 'live-domain' | 'credential'
  message: string
  value?: string
}

const SAFE_DOMAIN_SUFFIXES = ['.example', '.internal', '.test', '.invalid', '.localhost']
const NON_TARGET_DOTTED_SUFFIXES = ['.json', '.log', '.md', '.txt']
const NON_TARGET_DOTTED = new Set(['smtp.mailfrom'])

function isDocumentationIp(ip: string): boolean {
  return ip.startsWith('192.0.2.') || ip.startsWith('198.51.100.') || ip.startsWith('203.0.113.')
}

function isPrivateOrLocalIp(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  )
}

function isSafeDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/\.$/, '')
  return SAFE_DOMAIN_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
}

function isNonTargetDottedToken(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/\.$/, '')
  return NON_TARGET_DOTTED.has(normalized) || NON_TARGET_DOTTED_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
}

function textFields(lab: Lab): Array<[string, string]> {
  const fields: Array<[string, string]> = [
    ['title', lab.title],
    ['category', lab.category],
    ['brief', lab.brief],
    ['scope.allowed', lab.scope.allowed.join('\n')],
    ['scope.forbidden', lab.scope.forbidden.join('\n')],
    ['evidenceTitle', lab.evidenceTitle],
    ['evidence', lab.evidence],
    ['objectives', lab.objectives.join('\n')],
    ['guiding', lab.guiding.map((item) => `${item.q}\n${item.a}`).join('\n')],
    ['modelFindings', lab.modelFindings.map((finding) => `${finding.title}\n${finding.impact}\n${finding.remediation}`).join('\n')],
  ]
  if (lab.flagChallenge) {
    const challenge = lab.flagChallenge
    fields.push(
      ['flagChallenge.prompt', typeof challenge.prompt === 'string' ? challenge.prompt : ''],
      [
        'flagChallenge.assets',
        Array.isArray(challenge.assets)
          ? challenge.assets.map((asset) => `${asset?.label ?? ''}\n${asset?.description ?? ''}`).join('\n')
          : '',
      ],
      ['flagChallenge.expectedFlag', typeof challenge.expectedFlag === 'string' ? challenge.expectedFlag : ''],
      ['flagChallenge.hints', Array.isArray(challenge.hints) ? challenge.hints.join('\n') : ''],
      ['flagChallenge.explanation', typeof challenge.explanation === 'string' ? challenge.explanation : ''],
      ['flagChallenge.remediation', typeof challenge.remediation === 'string' ? challenge.remediation : ''],
      ['flagChallenge.reportPrompt', typeof challenge.reportPrompt === 'string' ? challenge.reportPrompt : ''],
    )
  }
  return fields
}

function scanUnsafeText(lab: Lab, errors: LabRegistryError[]) {
  for (const [field, value] of textFields(lab)) {
    const ipRe = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
    for (const match of value.matchAll(ipRe)) {
      const ip = match[0]
      if (!isDocumentationIp(ip) && !isPrivateOrLocalIp(ip)) {
        errors.push({ labId: lab.id, field, kind: 'public-ip', message: 'Public IP is not allowed in lab metadata.', value: ip })
      }
    }

    const emailRe = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi
    for (const match of value.matchAll(emailRe)) {
      const email = match[0]
      const host = match[1]
      if (!isSafeDomain(host)) {
        errors.push({ labId: lab.id, field, kind: 'real-email', message: 'Email must use a safe training domain.', value: email })
      }
    }

    const domainRe = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi
    for (const match of value.matchAll(domainRe)) {
      const domain = match[0]
      if (!isSafeDomain(domain) && !isNonTargetDottedToken(domain)) {
        errors.push({ labId: lab.id, field, kind: 'live-domain', message: 'Domain must be a safe training domain.', value: domain })
      }
    }

    const credentialRe = /\b(?:password|passwd|pwd|token|secret|api[_-]?key)\s*[:=]\s*(\S+)/gi
    for (const match of value.matchAll(credentialRe)) {
      const raw = match[0]
      const credential = match[1].replace(/[,"'}\]]+$/, '')
      if (!/^(?:\*+|<[^>]+>|placeholder|example|redacted|none|null)$/i.test(credential) && credential.length >= 8) {
        errors.push({ labId: lab.id, field, kind: 'credential', message: 'Credential-like assignment must be a placeholder.', value: raw })
      }
    }
  }
}

export function validateLabRegistry(labs: Lab[]): LabRegistryError[] {
  const errors: LabRegistryError[] = []
  const ids = new Set<string>()
  const expectedFlags = new Set<string>()

  for (const lab of labs) {
    if (!lab.id.trim()) errors.push({ labId: lab.id || '<missing>', field: 'id', kind: 'schema', message: 'Lab id is required.' })
    if (ids.has(lab.id)) errors.push({ labId: lab.id, field: 'id', kind: 'schema', message: 'Lab id must be unique.' })
    ids.add(lab.id)

    if (!LAB_KINDS.includes(lab.kind)) {
      errors.push({ labId: lab.id, field: 'kind', kind: 'schema', message: `Lab kind must be one of ${LAB_KINDS.join(', ')}.` })
    }
    if (lab.scope.allowed.length === 0) {
      errors.push({ labId: lab.id, field: 'scope.allowed', kind: 'schema', message: 'Allowed scope must not be empty.' })
    }
    if (lab.scope.forbidden.length === 0) {
      errors.push({ labId: lab.id, field: 'scope.forbidden', kind: 'schema', message: 'Forbidden scope must not be empty.' })
    }
    if (!lab.evidenceTitle.trim() || !lab.evidence.trim()) {
      errors.push({ labId: lab.id, field: 'evidence', kind: 'schema', message: 'Evidence title and evidence are required.' })
    }
    if (!lab.flagChallenge) {
      errors.push({ labId: lab.id, field: 'flagChallenge', kind: 'schema', message: 'Flag challenge metadata is required.' })
    } else {
      const challenge = lab.flagChallenge
      const requiredText = [challenge.prompt, challenge.explanation, challenge.remediation, challenge.reportPrompt]
      if (requiredText.some((value) => typeof value !== 'string' || !value.trim())) {
        errors.push({
          labId: lab.id,
          field: 'flagChallenge',
          kind: 'schema',
          message: 'Prompt, explanation, remediation, and report prompt are required.',
        })
      }
      if (!Array.isArray(challenge.assets) || challenge.assets.length === 0) {
        errors.push({ labId: lab.id, field: 'flagChallenge.assets', kind: 'schema', message: 'At least one local asset is required.' })
      } else {
        const assetIds = new Set<string>()
        for (const asset of challenge.assets) {
          if (
            !asset
            || typeof asset.id !== 'string'
            || typeof asset.label !== 'string'
            || typeof asset.description !== 'string'
            || !asset.id.trim()
            || !asset.label.trim()
            || !asset.description.trim()
          ) {
            errors.push({ labId: lab.id, field: 'flagChallenge.assets', kind: 'schema', message: 'Every asset needs an id, label, and description.' })
            continue
          }
          if (assetIds.has(asset.id)) {
            errors.push({ labId: lab.id, field: 'flagChallenge.assets', kind: 'schema', message: 'Asset ids must be unique within a challenge.' })
          }
          assetIds.add(asset.id)
          if (!FLAG_ASSET_KINDS.includes(asset.kind)) {
            errors.push({ labId: lab.id, field: 'flagChallenge.assets.kind', kind: 'schema', message: 'Asset kind is invalid.' })
          }
        }
      }
      if (
        !Array.isArray(challenge.hints)
        || challenge.hints.length === 0
        || challenge.hints.some((hint) => typeof hint !== 'string' || !hint.trim())
      ) {
        errors.push({ labId: lab.id, field: 'flagChallenge.hints', kind: 'schema', message: 'At least one non-empty hint is required.' })
      }
      if (!isExpectedFlagValid(challenge.expectedFlag)) {
        errors.push({
          labId: lab.id,
          field: 'flagChallenge.expectedFlag',
          kind: 'schema',
          message: 'Expected flag must use FLAG{UPPER_SNAKE_CASE} format.',
        })
      } else {
        const expectedFlag = canonicalFlag(challenge.expectedFlag)!
        if (expectedFlags.has(expectedFlag)) {
          errors.push({ labId: lab.id, field: 'flagChallenge.expectedFlag', kind: 'schema', message: 'Expected flags must be unique.' })
        }
        expectedFlags.add(expectedFlag)
      }
    }
    scanUnsafeText(lab, errors)
  }

  return errors
}
