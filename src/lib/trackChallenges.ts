import type { TrackChallenge } from '../data/tracks/types'
import type { TrackKey, TrackSubmission, TrackTimelineEvent } from '../types'
import { auditFields, type AuditField, type AuditFinding } from './labSafetyAudit'
import { normalizeLineSelection } from './labReport'

// ============================================================
// CEH+ review-style track challenges (P5-002 AppSec, P5-003 Cloud,
// P5-004 SOC): select lines, classify, write up. Each challenge also
// compiles into a module-0 review question so misses enter the Review Queue.
// ============================================================

export const WRITEUP_MIN_LENGTH = 15
export { TRACK_QUESTION_PREFIX, trackQuestionId, trackChallengeRawQuestion } from './trackQuestions'

export const TRACK_KIND_LABELS: Record<TrackChallenge['kind'], string> = {
  'code-review': 'Code review',
  'config-review': 'Config review',
  'log-investigation': 'Log investigation',
}

export interface TrackChallengeProblem {
  challengeId: string
  message: string
}

function auditFieldsForChallenge(challenge: TrackChallenge): AuditField[] {
  return [
    { field: 'title', text: challenge.title, mode: 'prose' },
    { field: 'scenario', text: challenge.scenario, mode: 'prose' },
    { field: 'artifact.label', text: challenge.artifact.label, mode: 'artifact' },
    { field: 'artifact.lines', text: challenge.artifact.lines.join('\n'), mode: 'artifact' },
    { field: 'linePrompt', text: challenge.linePrompt, mode: 'prose', instruction: true },
    { field: 'classification', text: [challenge.classification.prompt, ...challenge.classification.options].join('\n'), mode: 'prose' },
    { field: 'writeups', text: challenge.writeups.map((item) => `${item.label}\n${item.prompt}\n${item.model}`).join('\n'), mode: 'prose' },
    { field: 'explanation', text: challenge.explanation, mode: 'prose' },
    { field: 'remediation', text: challenge.remediation, mode: 'prose' },
    { field: 'detection', text: challenge.detection ?? '', mode: 'prose' },
    { field: 'containment', text: challenge.containment ?? '', mode: 'prose' },
    { field: 'leastPrivilege', text: challenge.leastPrivilege ?? '', mode: 'prose' },
    { field: 'safeFix', text: (challenge.safeFix ?? []).join('\n'), mode: 'artifact' },
    { field: 'testIdea', text: challenge.testIdea ?? '', mode: 'prose' },
    { field: 'timeline', text: (challenge.timeline ?? []).map((entry) => entry.observation).join('\n'), mode: 'prose' },
  ]
}

/** Safety audit findings (blockers and warnings) for one challenge. */
export function auditTrackChallenge(challenge: TrackChallenge): AuditFinding[] {
  return auditFields(auditFieldsForChallenge(challenge))
}

/** Schema, track-specific requirements, and safety blockers. Empty means publishable. */
export function validateTrackChallenges(challenges: TrackChallenge[]): TrackChallengeProblem[] {
  const problems: TrackChallengeProblem[] = []
  const ids = new Set<string>()
  const push = (challenge: TrackChallenge, message: string) => problems.push({ challengeId: challenge.id, message })

  for (const challenge of challenges) {
    if (!/^[A-Z]+-\d{2}$/.test(challenge.id)) push(challenge, 'Id must look like TRACK-01.')
    if (ids.has(challenge.id)) push(challenge, 'Id must be unique.')
    ids.add(challenge.id)
    const lineCount = challenge.artifact.lines.length
    if (lineCount < 3) push(challenge, 'Artifact needs at least three lines.')
    if (challenge.answerLines.length === 0) push(challenge, 'At least one answer line is required.')
    for (const line of challenge.answerLines) {
      if (!Number.isInteger(line) || line < 1 || line > lineCount) push(challenge, `Answer line ${line} is outside the artifact.`)
      else if (!challenge.artifact.lines[line - 1].trim()) push(challenge, `Answer line ${line} is blank.`)
    }
    const { options, answer } = challenge.classification
    if (options.length < 3 || new Set(options).size !== options.length) push(challenge, 'Classification needs three or more unique options.')
    if (!options.includes(answer)) push(challenge, 'Classification answer must be one of the options.')
    if (challenge.writeups.length < 2) push(challenge, 'At least two written deliverables are required.')
    if (challenge.writeups.some((item) => !item.key || !item.model.trim())) push(challenge, 'Every writeup needs a key and a model answer.')
    if (challenge.cehModules.length === 0 || challenge.cehModules.some((module) => !Number.isInteger(module) || module < 1 || module > 20)) {
      push(challenge, 'CEH modules must be integers 1-20.')
    }
    if (!challenge.explanation.trim() || !challenge.remediation.trim()) push(challenge, 'Explanation and remediation are required.')
    if (challenge.track === 'appsec' && (!challenge.safeFix?.length || !challenge.testIdea?.trim())) {
      push(challenge, 'AppSec challenges need a safe fix and a unit-test idea.')
    }
    if (challenge.track === 'cloud' && !challenge.leastPrivilege?.trim()) push(challenge, 'Cloud challenges need a least-privilege explanation.')
    if (challenge.track === 'soc') {
      if (!challenge.detection?.trim() || !challenge.containment?.trim()) push(challenge, 'SOC challenges need detection logic and a containment idea.')
      if (!challenge.skills.some((skill) => skill.startsWith('soc-'))) push(challenge, 'SOC challenges need a soc-* skill tag.')
      if (!challenge.timeline?.length) push(challenge, 'SOC challenges need a model timeline.')
      for (const entry of challenge.timeline ?? []) {
        const line = challenge.artifact.lines[entry.line - 1]
        if (!line || !line.includes(entry.time)) push(challenge, `Timeline entry ${entry.time} does not match artifact line ${entry.line}.`)
      }
    }
    for (const finding of auditTrackChallenge(challenge).filter((item) => item.severity === 'blocker')) {
      push(challenge, `Safety audit: ${finding.message} (${finding.field}: ${finding.value})`)
    }
  }
  return problems
}

export interface TrackDraft {
  selectedLines: number[]
  classification: string
  writeups: Record<string, string>
  timeline?: TrackTimelineEvent[]
}

export const TIMELINE_MIN_EVENTS = 2

/** A usable investigation timeline: two or more timestamped events, each with an observation. */
export function timelineComplete(timeline: TrackTimelineEvent[] | undefined): boolean {
  if (!timeline) return false
  const described = timeline.filter((event) => event.time && event.observation.trim().length >= 5)
  return described.length >= TIMELINE_MIN_EVENTS
}

export interface TrackGrade {
  linesCorrect: boolean
  missedLines: number[]
  extraLines: number[]
  classificationCorrect: boolean
  writeupsComplete: boolean
  missingWriteups: string[]
  correct: boolean
  scorePct: number
}

/**
 * Lines: every answer line selected and at most one extra context line. Classification must match.
 * Writeups must be substantive. `correct` requires lines + classification; score weights 40/30/30.
 */
export function gradeTrackDraft(challenge: TrackChallenge, draft: TrackDraft): TrackGrade {
  const selected = normalizeLineSelection(draft.selectedLines, challenge.artifact.lines.length)
  const missedLines = challenge.answerLines.filter((line) => !selected.includes(line))
  const extraLines = selected.filter((line) => !challenge.answerLines.includes(line))
  const linesCorrect = missedLines.length === 0 && extraLines.length <= 1
  const classificationCorrect = draft.classification === challenge.classification.answer
  const missingWriteups = challenge.writeups
    .filter((item) => (draft.writeups[item.key] ?? '').trim().length < WRITEUP_MIN_LENGTH)
    .map((item) => item.key)
  // SOC investigations also require a timeline: at least two timestamped events with observations.
  const needsTimeline = challenge.track === 'soc'
  if (needsTimeline && !timelineComplete(draft.timeline)) missingWriteups.push('timeline')
  const writeupsComplete = missingWriteups.length === 0
  const deliverableCount = challenge.writeups.length + (needsTimeline ? 1 : 0)
  const lineCredit = challenge.answerLines.length > 0
    ? Math.max(0, (challenge.answerLines.length - missedLines.length - Math.max(0, extraLines.length - 1)) / challenge.answerLines.length)
    : 0
  const writeupCredit = deliverableCount > 0 ? (deliverableCount - missingWriteups.length) / deliverableCount : 0
  const scorePct = Math.round(lineCredit * 40 + (classificationCorrect ? 30 : 0) + writeupCredit * 30)
  return {
    linesCorrect,
    missedLines,
    extraLines,
    classificationCorrect,
    writeupsComplete,
    missingWriteups,
    correct: linesCorrect && classificationCorrect,
    scorePct,
  }
}

/** Parses the leading ISO-8601 timestamp of a log line, if present. */
export function lineTimestamp(line: string): string | null {
  const match = line.match(/\b(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\b/)
  return match ? match[1] : null
}

/** Default timeline rows for selected log lines (time from the line, observation to be written). */
export function timelineFromLines(challenge: TrackChallenge, lines: number[]): TrackTimelineEvent[] {
  return normalizeLineSelection(lines, challenge.artifact.lines.length)
    .map((line) => ({ time: lineTimestamp(challenge.artifact.lines[line - 1]) ?? '', line, observation: '' }))
    .filter((event) => event.time)
    .sort((a, b) => a.time.localeCompare(b.time))
}

export interface TrackStatRow {
  key: string
  attempted: number
  solved: number
  total: number
  accuracyPct: number
}

export interface TrackStats {
  total: number
  attempted: number
  solved: number
  averageScorePct: number
  byCategory: TrackStatRow[]
  bySkill: TrackStatRow[]
  weakest: TrackStatRow[]
}

export function latestSubmissions(submissions: TrackSubmission[]): Map<string, TrackSubmission> {
  const latest = new Map<string, TrackSubmission>()
  for (const submission of [...submissions].sort((a, b) => a.at - b.at)) latest.set(submission.challengeId, submission)
  return latest
}

/** Weakness stats for a track: accuracy by category and skill from each challenge's latest submission. */
export function trackStats(challenges: TrackChallenge[], submissions: TrackSubmission[], track?: TrackKey): TrackStats {
  const scoped = track ? challenges.filter((challenge) => challenge.track === track) : challenges
  const latest = latestSubmissions(submissions)
  const buckets = (keyOf: (challenge: TrackChallenge) => string[]) => {
    const map = new Map<string, TrackStatRow>()
    for (const challenge of scoped) {
      const submission = latest.get(challenge.id)
      for (const key of keyOf(challenge)) {
        const row = map.get(key) ?? { key, attempted: 0, solved: 0, total: 0, accuracyPct: 0 }
        row.total++
        if (submission) row.attempted++
        if (submission?.correct) row.solved++
        map.set(key, row)
      }
    }
    return [...map.values()].map((row) => ({ ...row, accuracyPct: row.attempted > 0 ? Math.round((row.solved / row.attempted) * 100) : 0 }))
  }
  const byCategory = buckets((challenge) => [challenge.category]).sort((a, b) => a.key.localeCompare(b.key))
  const bySkill = buckets((challenge) => challenge.skills).sort((a, b) => a.key.localeCompare(b.key))
  const attemptedSubmissions = scoped.map((challenge) => latest.get(challenge.id)).filter((item): item is TrackSubmission => Boolean(item))
  return {
    total: scoped.length,
    attempted: attemptedSubmissions.length,
    solved: attemptedSubmissions.filter((item) => item.correct).length,
    averageScorePct: attemptedSubmissions.length > 0
      ? Math.round(attemptedSubmissions.reduce((sum, item) => sum + item.scorePct, 0) / attemptedSubmissions.length)
      : 0,
    byCategory,
    bySkill,
    weakest: [...byCategory, ...bySkill]
      .filter((row) => row.attempted > 0 && row.accuracyPct < 70)
      .sort((a, b) => a.accuracyPct - b.accuracyPct || b.attempted - a.attempted)
      .slice(0, 5),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Normalizes submissions against the static challenges; grades are recomputed, never trusted. */
export function normalizeTrackSubmissions(value: unknown, challenges: TrackChallenge[]): TrackSubmission[] {
  if (!Array.isArray(value)) return []
  const byId = new Map(challenges.map((challenge) => [challenge.id, challenge]))
  const out = new Map<string, TrackSubmission>()
  for (const row of value) {
    if (!isRecord(row) || typeof row.id !== 'string' || typeof row.challengeId !== 'string') continue
    const challenge = byId.get(row.challengeId)
    const at = typeof row.at === 'number' && Number.isFinite(row.at) && row.at > 0 ? row.at : null
    if (!challenge || !at) continue
    const writeups: Record<string, string> = {}
    if (isRecord(row.writeups)) {
      for (const item of challenge.writeups) {
        const text = row.writeups[item.key]
        if (typeof text === 'string') writeups[item.key] = text.slice(0, 4000)
      }
    }
    const timeline = Array.isArray(row.timeline)
      ? row.timeline.flatMap((event) => {
        if (!isRecord(event) || typeof event.time !== 'string' || typeof event.line !== 'number') return []
        return [{ time: event.time.slice(0, 40), line: event.line, observation: typeof event.observation === 'string' ? event.observation.slice(0, 1000) : '' }]
      })
      : undefined
    const draft: TrackDraft = {
      selectedLines: Array.isArray(row.selectedLines) ? row.selectedLines.filter((line): line is number => typeof line === 'number') : [],
      classification: typeof row.classification === 'string' ? row.classification : '',
      writeups,
      timeline,
    }
    const grade = gradeTrackDraft(challenge, draft)
    out.set(row.id, {
      id: row.id,
      challengeId: challenge.id,
      selectedLines: normalizeLineSelection(draft.selectedLines, challenge.artifact.lines.length),
      classification: draft.classification,
      writeups,
      timeline,
      correct: grade.correct,
      scorePct: grade.scorePct,
      at,
    })
  }
  return [...out.values()].sort((a, b) => a.at - b.at)
}
