// ============================================================
// Shared content-safety detectors for learner-facing text: reports,
// portfolio exports, lab metadata, and imported packs. Detection only —
// never used to suggest evasions. See docs/SAFETY_BOUNDARIES.md.
// ============================================================

export type SafetyHitKind =
  | 'public-ip'
  | 'real-email'
  | 'live-domain'
  | 'live-url'
  | 'credential'
  | 'private-key'
  | 'access-token'

export interface SafetyHit {
  kind: SafetyHitKind
  value: string
  message: string
}

export const SAFE_DOMAIN_SUFFIXES = ['.example', '.internal', '.test', '.invalid', '.localhost']
const NON_TARGET_DOTTED_SUFFIXES = ['.json', '.log', '.md', '.txt', '.png']
const NON_TARGET_DOTTED = new Set(['smtp.mailfrom'])

export const SAFETY_HIT_LABELS: Record<SafetyHitKind, string> = {
  'public-ip': 'Public IP address',
  'real-email': 'Email outside a training domain',
  'live-domain': 'Domain outside a training suffix',
  'live-url': 'URL to a non-training host',
  credential: 'Credential-like value',
  'private-key': 'Private key material',
  'access-token': 'Access-token-like string',
}

export function isDocumentationIp(ip: string): boolean {
  return ip.startsWith('192.0.2.') || ip.startsWith('198.51.100.') || ip.startsWith('203.0.113.')
}

export function isPrivateOrLocalIp(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 10
    || a === 127
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 169 && b === 254)
  )
}

export function isSafeDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/\.$/, '')
  return SAFE_DOMAIN_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
}

function isNonTargetDottedToken(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/\.$/, '')
  return NON_TARGET_DOTTED.has(normalized) || NON_TARGET_DOTTED_SUFFIXES.some((suffix) => normalized.endsWith(suffix))
}

const PLACEHOLDER_VALUE = /^(?:\*+|<[^>]+>|\[[^\]]+\]|placeholder|example|redacted|none|null)$/i

/**
 * Scans prose for targets and secrets that must not appear in training content.
 * `domains: 'strict'` flags every dotted token outside the safe suffixes (lab and pack metadata);
 * `domains: 'hosts'` only flags hosts inside URLs and emails (free-form learner writing, where file
 * names and code references are common).
 */
export function scanSensitiveText(text: string, options: { domains?: 'strict' | 'hosts' } = {}): SafetyHit[] {
  const hits: SafetyHit[] = []
  const domains = options.domains ?? 'strict'
  if (!text) return hits

  const ipRe = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
  for (const match of text.matchAll(ipRe)) {
    const ip = match[0]
    if (!isDocumentationIp(ip) && !isPrivateOrLocalIp(ip)) {
      hits.push({ kind: 'public-ip', value: ip, message: 'Public IP addresses are not allowed; use 192.0.2.0/24, 198.51.100.0/24, or 203.0.113.0/24.' })
    }
  }

  const urlRe = /\b(?:https?|ftp|ssh|telnet):\/\/([A-Za-z0-9.-]+)[^\s"'<>)]*/gi
  const urlHosts = new Set<string>()
  for (const match of text.matchAll(urlRe)) {
    const host = match[1].toLowerCase()
    urlHosts.add(host)
    if (!isSafeDomain(host) && !/^[\d.]+$/.test(host)) {
      hits.push({ kind: 'live-url', value: match[0], message: 'Links must point to a fictional training host (.example, .internal, .test, .invalid, .localhost).' })
    }
  }

  const emailRe = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi
  const emailHosts = new Set<string>()
  for (const match of text.matchAll(emailRe)) {
    emailHosts.add(match[1].toLowerCase())
    if (!isSafeDomain(match[1])) {
      hits.push({ kind: 'real-email', value: match[0], message: 'Email addresses must use a fictional training domain.' })
    }
  }

  if (domains === 'strict') {
    const domainRe = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi
    for (const match of text.matchAll(domainRe)) {
      const domain = match[0].toLowerCase()
      if (urlHosts.has(domain) || emailHosts.has(domain)) continue
      if (!isSafeDomain(domain) && !isNonTargetDottedToken(domain)) {
        hits.push({ kind: 'live-domain', value: match[0], message: 'Domains must use a fictional training suffix.' })
      }
    }
  }

  const credentialRe = /\b(?:password|passwd|pwd|token|secret|api[_-]?key)\s*[:=]\s*(\S+)/gi
  for (const match of text.matchAll(credentialRe)) {
    const credential = match[1].replace(/[,"'}\]]+$/, '')
    if (!PLACEHOLDER_VALUE.test(credential) && credential.length >= 8) {
      hits.push({ kind: 'credential', value: match[0], message: 'Credential-like values must be placeholders such as <redacted>.' })
    }
  }

  if (/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/i.test(text)) {
    hits.push({ kind: 'private-key', value: 'PEM private key marker', message: 'Private key material must never be stored or shared.' })
  }

  for (const match of text.matchAll(/\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g)) {
    hits.push({ kind: 'access-token', value: match[0], message: 'Access-token-like strings must be removed.' })
  }

  return hits
}

/** Replaces detected sensitive values with neutral placeholders for public-safe exports. */
export function redactSensitiveText(text: string): string {
  return text
    .replace(/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z0-9 ]*PRIVATE KEY-----|$)/gi, '[private-key-removed]')
    .replace(/\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g, '[token-removed]')
    .replace(/\b(password|passwd|pwd|token|secret|api[_-]?key)(\s*[:=]\s*)(\S+)/gi, '$1$2[redacted]')
    .replace(/\b(?:https?|ftp|ssh|telnet):\/\/([A-Za-z0-9.-]+)[^\s"'<>)]*/gi, (url, host: string) =>
      isSafeDomain(host) ? url : '[link-removed]')
    .replace(/\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi, (email, host: string) =>
      isSafeDomain(host) ? email : '[email-removed]')
    .replace(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, (ip) =>
      isDocumentationIp(ip) || isPrivateOrLocalIp(ip) ? ip : '[ip-removed]')
}
