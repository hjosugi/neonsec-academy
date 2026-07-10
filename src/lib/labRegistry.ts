import type { Lab, LabKind } from '../data/labs'

export const LAB_KINDS: LabKind[] = ['local', 'dataset', 'simulated', 'writeup']

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
  return [
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
    scanUnsafeText(lab, errors)
  }

  return errors
}
