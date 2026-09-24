import type { Lab, LabSafetyAuditRecord } from '../data/labs'
import { scanSensitiveText, type SafetyHitKind } from './contentSafety'

// ============================================================
// Lab Safety Audit (P4-010). Content review gate that runs before a lab
// is published or imported. Rules detect unsafe content and suggest the
// safe replacement from docs/SAFETY_BOUNDARIES.md. They never describe
// how to avoid detection.
// ============================================================

/** Bump when rules change; stored audit records must match the current version. */
export const AUDIT_RULESET_VERSION = 1
export const OVERRIDE_NOTE_MIN_LENGTH = 30

export type AuditRuleId =
  | 'forbidden-target'
  | 'forbidden-activity'
  | 'public-ip'
  | 'real-domain'
  | 'real-email'
  | 'credential-field'
  | 'live-malware'
  | 'command-recipe'
  | 'attack-payload'
  | 'sample-hash'

export type AuditSeverity = 'blocker' | 'warning'
export type TextMode = 'prose' | 'artifact'

export interface AuditRule {
  id: AuditRuleId
  label: string
  severity: AuditSeverity
  /** Unsafe category from the safety boundaries policy. */
  category: string
  /** Safe alternative suggested to the author. */
  safeAlternative: string
}

export const AUDIT_RULES: Record<AuditRuleId, AuditRule> = {
  'forbidden-target': {
    id: 'forbidden-target',
    label: 'Forbidden target type',
    severity: 'blocker',
    category: 'Real systems in scope',
    safeAlternative: 'Scope the lab to provided synthetic artifacts, a fictional organization, or a local toy app; list real systems only under forbidden scope.',
  },
  'forbidden-activity': {
    id: 'forbidden-activity',
    label: 'Instructs a forbidden activity',
    severity: 'blocker',
    category: 'Recon, exploitation, or attack execution',
    safeAlternative: 'Rewrite the step as analysis of provided artifacts: review synthetic scan output, reason about a static exchange, or write detection and remediation.',
  },
  'public-ip': {
    id: 'public-ip',
    label: 'Public IP address',
    severity: 'blocker',
    category: 'Real network target',
    safeAlternative: 'Use documentation ranges 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 or private ranges.',
  },
  'real-domain': {
    id: 'real-domain',
    label: 'Real domain or URL',
    severity: 'blocker',
    category: 'Real web target',
    safeAlternative: 'Use fictional hosts ending in .example, .internal, .test, .invalid, or .localhost.',
  },
  'real-email': {
    id: 'real-email',
    label: 'Real email address',
    severity: 'blocker',
    category: 'Real person or mailbox',
    safeAlternative: 'Use fictional mailboxes such as analyst@neoncorp.example.',
  },
  'credential-field': {
    id: 'credential-field',
    label: 'Credential-like value',
    severity: 'blocker',
    category: 'Real credentials or secrets',
    safeAlternative: 'Replace values with placeholders such as <redacted> or ***; teach secret handling through policy and code review.',
  },
  'live-malware': {
    id: 'live-malware',
    label: 'Live malware reference',
    severity: 'blocker',
    category: 'Malware',
    safeAlternative: 'Use generic, fictional process names and static toy indicators; focus on EDR alert review, containment, and prevention.',
  },
  'command-recipe': {
    id: 'command-recipe',
    label: 'Offensive tool command',
    severity: 'blocker',
    category: 'Actionable attack recipe',
    safeAlternative: 'Show synthetic tool output for review instead of the command, or ask for the defensive control that would detect the activity.',
  },
  'attack-payload': {
    id: 'attack-payload',
    label: 'Attack payload',
    severity: 'blocker',
    category: 'Web exploitation payload',
    safeAlternative: 'Redact probes as [REDACTED-INJECTION-PROBE] and teach the root cause and fix through vulnerable-code reasoning.',
  },
  'sample-hash': {
    id: 'sample-hash',
    label: 'Hash-like indicator',
    severity: 'warning',
    category: 'Possible real sample indicator',
    safeAlternative: 'Confirm the value is fabricated; prefer short fictional placeholders such as sha256:demo-0001.',
  },
}

const HIT_RULE: Record<SafetyHitKind, AuditRuleId> = {
  'public-ip': 'public-ip',
  'real-email': 'real-email',
  'live-domain': 'real-domain',
  'live-url': 'real-domain',
  credential: 'credential-field',
  'private-key': 'credential-field',
  'access-token': 'credential-field',
}

/** Common public TLDs used to spot real hosts inside code/log artifacts without flagging member access. */
const REAL_TLDS = new Set([
  'com', 'net', 'org', 'io', 'co', 'ai', 'app', 'dev', 'info', 'biz', 'xyz', 'online', 'site', 'tech',
  'cloud', 'gov', 'edu', 'mil', 'jp', 'uk', 'de', 'fr', 'cn', 'ru', 'us', 'ca', 'au', 'in', 'br', 'kr',
])

const FORBIDDEN_TARGET = /\b(?:production|prod environment|public internet|internet-facing|real (?:host|hosts|system|systems|network|website|site|account|accounts|user|users|target|targets|company|organization|customer|customers)|third[- ]party (?:site|service|website|api|system)|live (?:site|target|host|system|website|environment)|customer data)\b/i
const NEGATED_TARGET = /\b(?:no|not|never|without|forbidden|excluded|out of scope|do not|don't|must not)\b/i
const FORBIDDEN_ACTIVITY = /(?:^|[.:;]\s*)(?:scan|exploit|attack|brute[- ]force|crack|phish|exfiltrate|deploy|launch|execute|run|send|flood|bypass|hijack|dump|inject)\b(?! (?:analysis|review|summary|output|results?)\b)/i
const MALWARE_NAMES = /\b(?:mimikatz|emotet|wannacry|notpetya|trickbot|qakbot|ryuk|lockbit|conti|njrat|darkcomet|mirai|cobalt ?strike|metasploit|meterpreter|agent ?tesla|redline stealer|zeus)\b/i
const MALWARE_SOURCE = /\b(?:download|fetch|obtain)\b[^.]{0,40}\b(?:malware|ransomware|sample|dropper|payload)\b/i
const COMMAND_RECIPE = /(?:^|\s)(?:\$|#)\s*(?:nmap|masscan|sqlmap|hydra|hashcat|john|msfconsole|nc|netcat|nikto|gobuster|dirb)\b|\b(?:run|execute|launch|copy|paste)\s+(?:nmap|masscan|sqlmap|hydra|hashcat|john|msfconsole|nc|netcat|nikto|gobuster|dirb)\b/i
const PAYLOADS = /(?:'\s*or\s+'?1'?\s*=\s*'?1|\bunion\s+(?:all\s+)?select\b|<script\b|javascript:|onerror\s*=|\.\.\/\.\.\/|;\s*(?:rm|cat|wget|curl)\s|\$\(\s*(?:curl|wget|id|whoami)|\bsleep\(\s*\d+\s*\)--)/i
const HASH = /\b(?:[a-f0-9]{64}|[a-f0-9]{40}|[a-f0-9]{32})\b/i

export interface AuditField {
  field: string
  text: string
  mode: TextMode
  /** Fields where learner instructions live (scope allowed, objectives, prompts). */
  instruction?: boolean
}

export interface AuditTarget {
  id: string
  title: string
  fields: AuditField[]
}

export interface AuditFinding {
  rule: AuditRuleId
  severity: AuditSeverity
  field: string
  value: string
  message: string
  safeAlternative: string
}

export type AuditStatus = 'pass' | 'fail' | 'override'

export interface AuditReport {
  targetId: string
  title: string
  rulesetVersion: number
  findings: AuditFinding[]
  blockers: number
  warnings: number
  /** Computed status before any stored override is considered. */
  computedStatus: 'pass' | 'fail'
}

function finding(rule: AuditRuleId, field: string, value: string, message?: string): AuditFinding {
  const meta = AUDIT_RULES[rule]
  return {
    rule,
    severity: meta.severity,
    field,
    value: value.length > 120 ? `${value.slice(0, 117)}...` : value,
    message: message ?? meta.label,
    safeAlternative: meta.safeAlternative,
  }
}

function scanArtifactDomains(text: string): string[] {
  const out: string[] = []
  const domainRe = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63})\b/gi
  for (const match of text.matchAll(domainRe)) {
    const tld = match[1].toLowerCase()
    const host = match[0].toLowerCase()
    if (REAL_TLDS.has(tld) && !/\.(?:example|internal|test|invalid|localhost)\./.test(`${host}.`)) out.push(match[0])
  }
  return out
}

export function auditFields(fields: AuditField[]): AuditFinding[] {
  const findings: AuditFinding[] = []
  for (const { field, text, mode, instruction } of fields) {
    if (!text) continue
    const hits = scanSensitiveText(text, { domains: mode === 'prose' ? 'strict' : 'hosts' })
    for (const hit of hits) findings.push(finding(HIT_RULE[hit.kind], field, hit.value, hit.message))
    if (mode === 'artifact') {
      for (const host of scanArtifactDomains(text)) {
        if (!hits.some((hit) => hit.value.includes(host))) {
          findings.push(finding('real-domain', field, host, 'Artifact references a host with a real-world TLD.'))
        }
      }
    }
    if (instruction) {
      for (const line of text.split('\n')) {
        if (FORBIDDEN_TARGET.test(line) && !NEGATED_TARGET.test(line)) {
          findings.push(finding('forbidden-target', field, line.trim(), 'Scope or instructions include a real or production target.'))
        }
        if (FORBIDDEN_ACTIVITY.test(line.trim())) {
          findings.push(finding('forbidden-activity', field, line.trim(), 'Instruction asks the learner to perform an attack action.'))
        }
      }
    }
    const malware = text.match(MALWARE_NAMES)
    if (malware) findings.push(finding('live-malware', field, malware[0], 'References a real malware family or offensive framework.'))
    const source = text.match(MALWARE_SOURCE)
    if (source) findings.push(finding('live-malware', field, source[0], 'Asks for a live malware sample or payload.'))
    for (const line of text.split('\n')) {
      if (COMMAND_RECIPE.test(line)) findings.push(finding('command-recipe', field, line.trim()))
    }
    const payload = text.match(PAYLOADS)
    if (payload) findings.push(finding('attack-payload', field, payload[0]))
    const hash = text.match(HASH)
    if (hash) findings.push(finding('sample-hash', field, hash[0]))
  }
  return findings
}

export function auditTarget(target: AuditTarget): AuditReport {
  const findings = auditFields(target.fields)
  const blockers = findings.filter((item) => item.severity === 'blocker').length
  return {
    targetId: target.id,
    title: target.title,
    rulesetVersion: AUDIT_RULESET_VERSION,
    findings,
    blockers,
    warnings: findings.length - blockers,
    computedStatus: blockers > 0 ? 'fail' : 'pass',
  }
}

function joined(values: unknown): string {
  return Array.isArray(values) ? values.filter((value) => typeof value === 'string').join('\n') : typeof values === 'string' ? values : ''
}

/** Maps every learner-visible lab field to an audit field. Tolerates malformed drafts. */
export function labAuditTarget(lab: Lab): AuditTarget {
  const challenge = lab.flagChallenge
  return {
    id: String(lab.id ?? '<missing>'),
    title: String(lab.title ?? 'Untitled lab'),
    fields: [
      { field: 'title', text: joined(lab.title), mode: 'prose' },
      { field: 'brief', text: joined(lab.brief), mode: 'prose' },
      { field: 'scope.allowed', text: joined(lab.scope?.allowed), mode: 'prose', instruction: true },
      { field: 'scope.forbidden', text: joined(lab.scope?.forbidden), mode: 'prose' },
      { field: 'evidenceTitle', text: joined(lab.evidenceTitle), mode: 'prose' },
      { field: 'evidence', text: joined(lab.evidence), mode: 'artifact' },
      { field: 'objectives', text: joined(lab.objectives), mode: 'prose', instruction: true },
      { field: 'guiding', text: Array.isArray(lab.guiding) ? lab.guiding.map((item) => `${item?.q ?? ''}\n${item?.a ?? ''}`).join('\n') : '', mode: 'prose' },
      { field: 'flagChallenge.prompt', text: joined(challenge?.prompt), mode: 'prose', instruction: true },
      { field: 'flagChallenge.hints', text: joined(challenge?.hints), mode: 'prose' },
      { field: 'flagChallenge.explanation', text: joined(challenge?.explanation), mode: 'prose' },
      { field: 'flagChallenge.remediation', text: joined(challenge?.remediation), mode: 'prose' },
      { field: 'flagChallenge.reportPrompt', text: joined(challenge?.reportPrompt), mode: 'prose', instruction: true },
      {
        field: 'modelFindings',
        text: Array.isArray(lab.modelFindings)
          ? lab.modelFindings.map((item) => `${item?.title ?? ''}\n${item?.impact ?? ''}\n${item?.remediation ?? ''}`).join('\n')
          : '',
        mode: 'prose',
      },
      { field: 'analysis', text: lab.analysis ? `${lab.analysis.detection ?? ''}\n${lab.analysis.prevention ?? ''}` : '', mode: 'prose' },
      { field: 'webConcept.unsafeTargetWarning', text: joined(lab.webConcept?.unsafeTargetWarning), mode: 'prose' },
    ],
  }
}

export function auditLab(lab: Lab): AuditReport {
  return auditTarget(labAuditTarget(lab))
}

export interface PublishDecision {
  targetId: string
  publishable: boolean
  status: AuditStatus
  reasons: string[]
  report: AuditReport
}

/** Validates the stored audit record shape; returns problems, empty when valid. */
export function auditRecordProblems(record: LabSafetyAuditRecord | undefined): string[] {
  if (!record) return ['Missing safetyAudit record; run the lab safety audit and store its result.']
  const problems: string[] = []
  if (record.rulesetVersion !== AUDIT_RULESET_VERSION) {
    problems.push(`Stored audit uses ruleset v${record.rulesetVersion}; re-audit with v${AUDIT_RULESET_VERSION}.`)
  }
  if (record.status !== 'pass' && record.status !== 'override') problems.push('Stored audit status must be pass or override.')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.reviewedAt ?? '')) problems.push('Stored audit needs a reviewedAt date (YYYY-MM-DD).')
  if (record.status === 'override') {
    if ((record.overrideNote ?? '').trim().length < OVERRIDE_NOTE_MIN_LENGTH) {
      problems.push(`Manual override requires a safety review note of at least ${OVERRIDE_NOTE_MIN_LENGTH} characters.`)
    }
    if (!record.reviewer?.trim()) problems.push('Manual override requires a named safety reviewer.')
    if (!record.acceptedRules || record.acceptedRules.length === 0) problems.push('Manual override must list the accepted rule ids.')
  }
  return problems
}

/**
 * Publish gate: a lab is publishable only when its current audit has no blockers and a matching
 * `pass` record is stored, or when every blocker is covered by a documented manual override.
 */
export function publishDecision(lab: Lab): PublishDecision {
  const report = auditLab(lab)
  const record = lab.safetyAudit
  const reasons = auditRecordProblems(record)
  const blockerRules = new Set(report.findings.filter((item) => item.severity === 'blocker').map((item) => item.rule))

  if (report.computedStatus === 'fail') {
    if (record?.status === 'override') {
      const uncovered = [...blockerRules].filter((rule) => !record.acceptedRules?.includes(rule))
      if (uncovered.length > 0) reasons.push(`Override does not cover: ${uncovered.join(', ')}.`)
    } else {
      reasons.push(`${report.blockers} blocker${report.blockers === 1 ? '' : 's'} found by the safety audit.`)
    }
  } else if (record?.status === 'override') {
    reasons.push('Audit now passes; replace the manual override with a pass record.')
  }

  const publishable = reasons.length === 0
  return {
    targetId: report.targetId,
    publishable,
    status: publishable ? (record?.status === 'override' ? 'override' : 'pass') : 'fail',
    reasons,
    report,
  }
}

export function publishGate(labs: Lab[]): { publishable: PublishDecision[]; rejected: PublishDecision[] } {
  const decisions = labs.map(publishDecision)
  return {
    publishable: decisions.filter((decision) => decision.publishable),
    rejected: decisions.filter((decision) => !decision.publishable),
  }
}

/** Record an author stores in lab metadata after a clean audit. */
export function passRecord(reviewedAt: string): LabSafetyAuditRecord {
  return { rulesetVersion: AUDIT_RULESET_VERSION, status: 'pass', reviewedAt }
}

export function auditReportToMarkdown(decisions: PublishDecision[]): string {
  const lines = ['# Lab Safety Audit', '', `Ruleset v${AUDIT_RULESET_VERSION}`, '', '| Lab | Decision | Blockers | Warnings |', '|---|---|---|---|']
  for (const decision of decisions) {
    lines.push(`| ${decision.report.title} | ${decision.publishable ? decision.status : 'rejected'} | ${decision.report.blockers} | ${decision.report.warnings} |`)
  }
  for (const decision of decisions.filter((item) => item.report.findings.length > 0 || item.reasons.length > 0)) {
    lines.push('', `## ${decision.report.title}`, '')
    for (const reason of decision.reasons) lines.push(`- Gate: ${reason}`)
    for (const item of decision.report.findings) {
      lines.push(`- [${item.severity}] ${AUDIT_RULES[item.rule].label} in \`${item.field}\`: ${item.value} — suggestion: ${item.safeAlternative}`)
    }
  }
  return lines.join('\n')
}
