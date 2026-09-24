import type { TrackChallenge } from '../data/tracks/types'
import type {
  ExamResult,
  PracticalResult,
  Report,
  Severity,
  TrackKey,
  TrackSubmission,
  TriageFinding,
} from '../types'
import { redactSensitiveText, scanSensitiveText, type SafetyHit } from './contentSafety'
import { latestSubmissions } from './trackChallenges'
import { effectiveSeverity } from './triage'

// ============================================================
// Portfolio Evidence Exporter (P5-007). Builds a Markdown portfolio of
// learning results that is safe to publish. Public-safe mode (default)
// removes evidence text and replaces sensitive values with placeholders.
// ============================================================

export type PortfolioSection = 'mockExams' | 'practical' | 'tracks' | 'reports' | 'findings' | 'reflections'

export const PORTFOLIO_SECTIONS: Array<{ key: PortfolioSection; label: string; description: string }> = [
  { key: 'mockExams', label: 'Mock exam stats', description: 'Best, latest, and average scores; no answers.' },
  { key: 'practical', label: 'Practical simulator', description: 'Readiness scores by challenge type; no answers.' },
  { key: 'tracks', label: 'CEH+ track progress', description: 'Solved challenges per track.' },
  { key: 'reports', label: 'Lab reports', description: 'Report titles, scope, and sanitized finding summaries.' },
  { key: 'findings', label: 'Sanitized findings', description: 'Triage findings: title, severity, status, remediation.' },
  { key: 'reflections', label: 'Reflection notes', description: 'Your own lessons-learned notes.' },
]

export const PRIVACY_CHECKLIST = [
  'No real client, employer, or target organization names appear in the selected content.',
  'No real IP addresses, hostnames, URLs, or email addresses of real systems or people are included.',
  'No credentials, tokens, keys, session values, or flags are included.',
  'No personal data about other people (names, contacts, records) is included.',
  'No non-public information from work, customers, or third parties is included.',
  'I understand this Markdown may be shared publicly and I reviewed the preview.',
] as const

export interface PortfolioInput {
  examResults: ExamResult[]
  practicalResults: PracticalResult[]
  reports: Report[]
  triageFindings: TriageFinding[]
  trackSubmissions: TrackSubmission[]
  trackChallenges: TrackChallenge[]
  trackNames: Record<TrackKey, string>
  reflection: string
  displayName: string
}

export interface PortfolioOptions {
  publicSafe: boolean
  sections: PortfolioSection[]
  reportIds: string[]
  generatedAt?: number
}

export interface PortfolioResult {
  markdown: string
  /** Sensitive values still present in the output (must be empty before a public export). */
  sensitiveHits: SafetyHit[]
  /** Template or unfinished placeholders such as TODO or <your role>. */
  placeholderWarnings: string[]
  /** Number of values replaced by placeholders in public-safe mode. */
  redactions: number
}

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

function countSeverities(items: Array<{ severity: Severity }>): string {
  const parts = SEVERITIES.flatMap((severity) => {
    const count = items.filter((item) => item.severity === severity).length
    return count > 0 ? [`${count} ${severity}`] : []
  })
  return parts.length > 0 ? parts.join(', ') : 'none'
}

function inline(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/** Counts how many sensitive values a redaction pass would replace. */
function redactionCount(text: string): number {
  return scanSensitiveText(text, { domains: 'real-tlds' }).length
}

/** Detects unfinished template placeholders left in learner text. */
export function placeholderWarnings(text: string): string[] {
  const warnings = new Set<string>()
  for (const match of text.matchAll(/\b(?:TODO|TBD|FIXME|XXX)\b/g)) warnings.add(`Unfinished marker "${match[0]}"`)
  for (const match of text.matchAll(/<(?:your|insert|name|company|role|date)[^>]*>/gi)) warnings.add(`Template placeholder "${match[0]}"`)
  for (const match of text.matchAll(/\[(?:your|insert|name|company|role)[^\]]*\]/gi)) warnings.add(`Template placeholder "${match[0]}"`)
  return [...warnings]
}

export function buildPortfolio(input: PortfolioInput, options: PortfolioOptions): PortfolioResult {
  const safe = (value: string) => (options.publicSafe ? redactSensitiveText(value) : value)
  const include = (section: PortfolioSection) => options.sections.includes(section)
  const lines: string[] = [
    `# ${inline(input.displayName) || 'Security Learner'} — Security Practice Portfolio`,
    '',
    `_Generated ${new Date(options.generatedAt ?? Date.now()).toISOString().slice(0, 10)} with NeonSec Academy. All labs, targets, and data are synthetic training material._`,
    '',
  ]
  let rawText = ''

  if (include('mockExams')) {
    const results = [...input.examResults].sort((a, b) => a.submittedAt - b.submittedAt)
    lines.push('## CEH Mock Exams', '')
    if (results.length === 0) lines.push('_No mock exams completed yet._', '')
    else {
      const scores = results.map((result) => Math.round(result.scorePct))
      lines.push(
        `- Mock exams completed: ${results.length}`,
        `- Best score: ${Math.max(...scores)}% · latest: ${scores[scores.length - 1]}% · average: ${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%`,
        `- Passed at target: ${results.filter((result) => result.passed).length}/${results.length}`,
        '',
      )
    }
  }

  if (include('practical')) {
    lines.push('## Practical Simulator', '')
    if (input.practicalResults.length === 0) lines.push('_No practical sessions completed yet._', '')
    else {
      const best = input.practicalResults.reduce((top, result) => (result.scorePct > top.scorePct ? result : top))
      lines.push(
        `- Sessions completed: ${input.practicalResults.length}; best ${best.scorePct}% (${best.correct}/${best.total})`,
        ...best.perKind.map((row) => `- ${row.kind}: ${row.correct}/${row.total} (${row.pct}%)`),
        '',
      )
    }
  }

  if (include('tracks')) {
    const latest = latestSubmissions(input.trackSubmissions)
    lines.push('## CEH+ Practical Tracks', '')
    const tracks = [...new Set(input.trackChallenges.map((challenge) => challenge.track))]
    for (const track of tracks) {
      const challenges = input.trackChallenges.filter((challenge) => challenge.track === track)
      const solved = challenges.filter((challenge) => latest.get(challenge.id)?.correct)
      lines.push(`- ${input.trackNames[track]}: ${solved.length}/${challenges.length} challenges solved${solved.length ? ` (${[...new Set(solved.map((challenge) => challenge.category))].join(', ')})` : ''}`)
    }
    lines.push('')
  }

  if (include('reports')) {
    const reports = input.reports.filter((report) => options.reportIds.includes(report.id))
    lines.push('## Lab Reports', '')
    if (reports.length === 0) lines.push('_No reports selected._', '')
    for (const report of reports) {
      rawText += `${report.title}\n${report.scope}\n${report.summary}\n${report.findings.map((finding) => `${finding.title}\n${finding.remediation}\n${finding.evidence}`).join('\n')}\n`
      lines.push(`### ${safe(inline(report.title || 'Untitled report'))}`, '')
      lines.push(`- Scope: ${safe(inline(report.scope || 'Synthetic training scope'))}`)
      lines.push(`- Findings: ${report.findings.length} (${countSeverities(report.findings)})`)
      if (report.summary.trim()) lines.push(`- Summary: ${safe(inline(report.summary))}`)
      for (const finding of report.findings) {
        lines.push(`  - [${finding.severity}] ${safe(inline(finding.title || 'Untitled finding'))} — fix: ${safe(inline(finding.remediation || 'not recorded'))}`)
        if (!options.publicSafe && finding.evidence.trim()) lines.push(`    - Evidence: ${inline(finding.evidence)}`)
      }
      lines.push('')
    }
  }

  if (include('findings')) {
    lines.push('## Triaged Findings', '')
    if (input.triageFindings.length === 0) lines.push('_No triaged findings yet._', '')
    for (const finding of input.triageFindings) {
      rawText += `${finding.title}\n${finding.asset}\n${finding.evidence}\n${finding.remediation}\n`
      lines.push(`- [${effectiveSeverity(finding)}] ${safe(inline(finding.title))} · status ${finding.status} — ${safe(inline(finding.remediation || 'no remediation recorded'))}`)
      if (!options.publicSafe) lines.push(`  - Asset: ${inline(finding.asset)}; evidence: ${inline(finding.evidence)}`)
    }
    lines.push('')
  }

  if (include('reflections')) {
    rawText += `${input.reflection}\n`
    lines.push('## Reflection', '', input.reflection.trim() ? safe(input.reflection.trim()) : '_No reflection written yet._', '')
  }

  lines.push('---', '_Public-safe mode: evidence text, submitted answers, flags, and sensitive values are excluded or replaced with placeholders._')
  if (!options.publicSafe) lines.pop()
  if (!options.publicSafe) lines.push('_Private mode: evidence notes are included. Do not publish without review._')

  const markdown = lines.join('\n')
  return {
    markdown,
    sensitiveHits: scanSensitiveText(markdown, { domains: 'real-tlds' }),
    placeholderWarnings: placeholderWarnings(markdown),
    redactions: options.publicSafe ? redactionCount(rawText) : 0,
  }
}

/** Export is allowed only when the privacy checklist is confirmed and no sensitive values remain. */
export function canExportPortfolio(result: PortfolioResult, confirmed: boolean[]): { ok: boolean; reasons: string[] } {
  const reasons: string[] = []
  if (confirmed.length < PRIVACY_CHECKLIST.length || confirmed.some((value) => !value)) reasons.push('Confirm every privacy checklist item.')
  if (result.sensitiveHits.length > 0) reasons.push(`${result.sensitiveHits.length} sensitive value(s) remain; enable public-safe mode or edit the source content.`)
  return { ok: reasons.length === 0, reasons }
}
