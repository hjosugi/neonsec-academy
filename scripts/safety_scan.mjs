#!/usr/bin/env node
// Read-only safety scan for release content.
// Checks seed questions, safe labs, and seed content for live targets,
// credential-like material, and actionable command recipes.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const QUESTION_DIR = join(ROOT, 'src', 'data', 'questions')
const LAB_FILE = join(ROOT, 'src', 'data', 'labs.ts')
const SEED_DIR = join(ROOT, 'seed_content')

const SAFE_EXACT_DOMAINS = new Set(['first.org', 'crt.sh', 'in-addr.arpa'])
const SAFE_DOMAIN_SUFFIXES = ['.example', '.internal', '.test', '.invalid', '.localhost']
const NON_TARGET_DOTTED_TOKENS = new Set([
  'db.deleteuser',
  'document.referrer',
  'l.id',
  'labs.find',
  'objectives.evidence',
  'objectives.explanation',
  'objectives.flag',
  'objectives.remediation',
  'request.params.id',
  'smtp.mailfrom',
])
const FILE_SUFFIXES = ['.json', '.log', '.md', '.png', '.txt']

const findings = []
const counters = {
  files: 0,
  lines: 0,
  questionFiles: 0,
  questions: 0,
  labs: 0,
  seedFiles: 0,
  seedJsonlRows: 0,
  documentationIps: 0,
  privateIps: 0,
  safeDomains: 0,
  safeEmails: 0,
  nonTargetDottedTokens: 0,
  commandRecipes: 0,
  credentialPlaceholders: 0,
}

function rel(file) {
  return relative(ROOT, file)
}

function readText(file) {
  counters.files++
  return readFileSync(file, 'utf8')
}

function addFinding(severity, kind, file, line, value, reason) {
  findings.push({ severity, kind, file: rel(file), line, value, reason })
}

function isDocumentationIp(ip) {
  return ip.startsWith('192.0.2.') || ip.startsWith('198.51.100.') || ip.startsWith('203.0.113.')
}

function isPrivateOrLocalIp(ip) {
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  )
}

function normalizeDomain(domain) {
  return domain.toLowerCase().replace(/\.$/, '')
}

function isSafeDomain(domain) {
  const d = normalizeDomain(domain)
  return SAFE_EXACT_DOMAINS.has(d) || SAFE_DOMAIN_SUFFIXES.some((suffix) => d.endsWith(suffix))
}

function isNonTargetDottedToken(domain) {
  const d = normalizeDomain(domain)
  return NON_TARGET_DOTTED_TOKENS.has(d) || FILE_SUFFIXES.some((suffix) => d.endsWith(suffix))
}

function hostFromUrl(raw) {
  try {
    return new URL(raw.replace(/[),.;]+$/, '')).hostname
  } catch {
    return null
  }
}

function scanLine(file, lineNo, line) {
  const urlRe = /\b(?:https?|ftp|ssh|telnet):\/\/[A-Za-z0-9][^\s"'<>)]*/gi
  for (const match of line.matchAll(urlRe)) {
    const url = match[0]
    const host = hostFromUrl(url)
    if (!host || !isSafeDomain(host)) {
      addFinding('blocker', 'live-url', file, lineNo, url, 'URL host is not an allowed documentation or safe-training domain.')
    } else {
      counters.safeDomains++
    }
  }

  const emailRe = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi
  for (const match of line.matchAll(emailRe)) {
    const email = match[0]
    const host = match[1]
    if (isSafeDomain(host)) counters.safeEmails++
    else addFinding('blocker', 'real-email', file, lineNo, email, 'Email address is not in a safe-training domain.')
  }

  const domainRe = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi
  for (const match of line.matchAll(domainRe)) {
    const domain = normalizeDomain(match[0])
    if (domain.includes('@')) continue
    if (isNonTargetDottedToken(domain)) counters.nonTargetDottedTokens++
    else if (isSafeDomain(domain)) counters.safeDomains++
    else addFinding('blocker', 'live-domain', file, lineNo, domain, 'Domain is not an allowed documentation or safe-training domain.')
  }

  const ipRe = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
  for (const match of line.matchAll(ipRe)) {
    const ip = match[0]
    if (isDocumentationIp(ip)) counters.documentationIps++
    else if (isPrivateOrLocalIp(ip)) counters.privateIps++
    else addFinding('blocker', 'public-ip', file, lineNo, ip, 'IP address is public-routable rather than documentation/private/local space.')
  }

  const pemRe = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/i
  if (pemRe.test(line)) {
    addFinding('blocker', 'private-key', file, lineNo, 'PEM private key marker', 'Private key material must not appear in release content.')
  }

  const tokenRe = /\b(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,})\b/g
  for (const match of line.matchAll(tokenRe)) {
    addFinding('blocker', 'access-token', file, lineNo, match[0], 'Credential-like access token detected.')
  }

  const assignmentRe = /\b(?:password|passwd|pwd|token|secret|api[_-]?key)\s*[:=]\s*(\S+)/gi
  for (const match of line.matchAll(assignmentRe)) {
    const value = match[1].replace(/[,"'}\]]+$/, '')
    if (/^(?:\*+|<[^>]+>|placeholder|example|redacted|none|null)$/i.test(value)) {
      counters.credentialPlaceholders++
    } else if (value.length >= 8) {
      addFinding('blocker', 'credential-assignment', file, lineNo, match[0], 'Credential-like assignment is not clearly a placeholder.')
    }
  }

  const commandRecipeRe = /(?:^|\s)(?:\$|#)\s*(?:nmap|masscan|sqlmap|hydra|hashcat|john|msfconsole|nc|netcat)\b|\b(?:run|execute|launch|copy|paste)\s+(?:nmap|masscan|sqlmap|hydra|hashcat|john|msfconsole|nc|netcat)\b/i
  if (commandRecipeRe.test(line)) {
    counters.commandRecipes++
    addFinding('blocker', 'command-recipe', file, lineNo, line.trim(), 'Actionable command recipe detected in release content.')
  }
}

function scanTextFile(file) {
  const text = readText(file)
  const lines = text.split(/\r?\n/)
  counters.lines += lines.length
  lines.forEach((line, i) => scanLine(file, i + 1, line))
  return text
}

function scanQuestions() {
  const files = readdirSync(QUESTION_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
  counters.questionFiles = files.length

  for (const name of files) {
    const file = join(QUESTION_DIR, name)
    const text = scanTextFile(file)
    try {
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) counters.questions += parsed.length
      else addFinding('blocker', 'question-json', file, 1, name, 'Question file top-level value is not an array.')
    } catch (error) {
      addFinding('blocker', 'question-json', file, 1, name, `Question file is invalid JSON: ${error.message}`)
    }
  }
}

function scanLabs() {
  const text = scanTextFile(LAB_FILE)
  counters.labs = [...text.matchAll(/\n\s+id:\s*['"][^'"]+['"]/g)].length
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) out.push(...walk(path))
    else out.push(path)
  }
  return out
}

function scanSeedContent() {
  const files = walk(SEED_DIR).filter((file) => /\.(jsonl|ya?ml|md|txt|json)$/i.test(file))
  counters.seedFiles = files.length
  for (const file of files) {
    const text = scanTextFile(file)
    if (file.endsWith('.jsonl')) counters.seedJsonlRows += text.split(/\r?\n/).filter(Boolean).length
  }
}

scanQuestions()
scanLabs()
scanSeedContent()

const blockers = findings.filter((finding) => finding.severity === 'blocker')

console.log('Safety scan corpus')
console.log(`  question files: ${counters.questionFiles}`)
console.log(`  questions: ${counters.questions}`)
console.log(`  lab definitions: ${counters.labs}`)
console.log(`  seed files: ${counters.seedFiles}`)
console.log(`  seed JSONL rows: ${counters.seedJsonlRows}`)
console.log(`  scanned files: ${counters.files}`)
console.log(`  scanned lines: ${counters.lines}`)
console.log('')
console.log('Safety scan results')
console.log(`  blockers: ${blockers.length}`)
console.log(`  documentation IP references: ${counters.documentationIps}`)
console.log(`  private/local IP references: ${counters.privateIps}`)
console.log(`  safe domain references: ${counters.safeDomains}`)
console.log(`  safe email references: ${counters.safeEmails}`)
console.log(`  non-target dotted tokens: ${counters.nonTargetDottedTokens}`)
console.log(`  credential placeholders: ${counters.credentialPlaceholders}`)
console.log(`  actionable command recipes: ${counters.commandRecipes}`)

if (blockers.length > 0) {
  console.log('')
  console.log('Blockers')
  for (const finding of blockers.slice(0, 80)) {
    console.log(`  ${finding.file}:${finding.line} [${finding.kind}] ${finding.reason} (${finding.value})`)
  }
  if (blockers.length > 80) console.log(`  ... ${blockers.length - 80} more`)
  process.exit(1)
}

console.log('')
console.log('PASS: no unsafe content blockers found.')
