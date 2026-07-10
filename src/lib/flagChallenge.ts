import type { FlagChallengeDefinition, Lab } from '../data/labs'
import type { FlagAttempt, FlagHintUse } from '../types'

export const FLAG_FORMAT = /^FLAG\{[A-Z0-9][A-Z0-9_-]{2,63}\}$/
const MAX_SUBMISSION_LENGTH = 160

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function validTimestamp(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Number.isFinite(new Date(value).getTime()) ? value : null
}

export function sanitizeFlagSubmission(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim()
  if (!clean || clean.length > MAX_SUBMISSION_LENGTH || /[\u0000-\u001f\u007f]/.test(clean)) return null
  return clean
}

export function canonicalFlag(value: unknown): string | null {
  return sanitizeFlagSubmission(value)?.toUpperCase() ?? null
}

export function isExpectedFlagValid(value: unknown): boolean {
  const clean = sanitizeFlagSubmission(value)
  return clean !== null && FLAG_FORMAT.test(clean)
}

export function isFlagCorrect(
  challenge: Pick<FlagChallengeDefinition, 'expectedFlag'>,
  submission: unknown,
): boolean {
  const expected = canonicalFlag(challenge.expectedFlag)
  const actual = canonicalFlag(submission)
  return expected !== null && actual !== null && expected === actual
}

export function flagAttemptsForChallenge(attempts: FlagAttempt[], challengeId: string): FlagAttempt[] {
  return attempts
    .filter((attempt) => attempt.challengeId === challengeId)
    .sort((a, b) => b.at - a.at)
}

export function flagHintUsesForChallenge(hintUses: FlagHintUse[], challengeId: string): FlagHintUse[] {
  return hintUses
    .filter((use) => use.challengeId === challengeId)
    .sort((a, b) => a.hintIndex - b.hintIndex)
}

export function isFlagChallengeSolved(attempts: FlagAttempt[], challengeId: string): boolean {
  return attempts.some((attempt) => attempt.challengeId === challengeId && attempt.correct)
}

export function normalizeFlagAttempts(value: unknown, labs: Lab[]): FlagAttempt[] {
  if (!Array.isArray(value)) return []
  const labsById = new Map(labs.map((lab) => [lab.id, lab]))
  const byId = new Map<string, FlagAttempt>()

  for (const row of value) {
    if (!isRecord(row)) continue
    const id = cleanString(row.id)
    const challengeId = cleanString(row.challengeId)
    const submitted = sanitizeFlagSubmission(row.submitted)
    const at = validTimestamp(row.at)
    const lab = challengeId ? labsById.get(challengeId) : undefined
    if (!id || !challengeId || !submitted || !at || !lab) continue

    const rawHintCount = typeof row.hintCount === 'number' && Number.isInteger(row.hintCount)
      ? row.hintCount
      : 0
    const hintCount = Math.max(0, Math.min(rawHintCount, lab.flagChallenge.hints.length))
    byId.set(id, {
      id,
      challengeId,
      submitted,
      correct: isFlagCorrect(lab.flagChallenge, submitted),
      hintCount,
      at,
    })
  }

  return [...byId.values()].sort((a, b) => a.at - b.at)
}

export function normalizeFlagHintUses(value: unknown, labs: Lab[]): FlagHintUse[] {
  if (!Array.isArray(value)) return []
  const labsById = new Map(labs.map((lab) => [lab.id, lab]))
  const byChallengeHint = new Map<string, FlagHintUse>()

  for (const row of value) {
    if (!isRecord(row)) continue
    const challengeId = cleanString(row.challengeId)
    const usedAt = validTimestamp(row.usedAt)
    const hintIndex = row.hintIndex
    const lab = challengeId ? labsById.get(challengeId) : undefined
    if (
      !challengeId
      || !usedAt
      || !lab
      || typeof hintIndex !== 'number'
      || !Number.isInteger(hintIndex)
      || hintIndex < 0
      || hintIndex >= lab.flagChallenge.hints.length
    ) {
      continue
    }

    const key = `${challengeId}:${hintIndex}`
    const previous = byChallengeHint.get(key)
    if (!previous || usedAt < previous.usedAt) {
      byChallengeHint.set(key, { challengeId, hintIndex, usedAt })
    }
  }

  return [...byChallengeHint.values()].sort((a, b) => a.usedAt - b.usedAt)
}

export interface FlagChallengeAnalyticsRow {
  challengeId: string
  title: string
  attempts: number
  incorrectAttempts: number
  solved: boolean
  firstTrySolved: boolean
  hintsUsed: number
  solvedAt: number | null
  lastAttemptAt: number | null
}

export interface FlagChallengeAnalytics {
  totalChallenges: number
  attemptedChallenges: number
  solvedChallenges: number
  solveRatePct: number
  totalAttempts: number
  incorrectAttempts: number
  attemptAccuracyPct: number
  firstTrySolved: number
  hintsUsed: number
  byChallenge: FlagChallengeAnalyticsRow[]
}

export function computeFlagChallengeAnalytics(
  labs: Lab[],
  attempts: FlagAttempt[],
  hintUses: FlagHintUse[],
): FlagChallengeAnalytics {
  const byChallenge = labs.map((lab): FlagChallengeAnalyticsRow => {
    const challengeAttempts = attempts
      .filter((attempt) => attempt.challengeId === lab.id)
      .sort((a, b) => a.at - b.at)
    const challengeHints = new Set(
      hintUses.filter((use) => use.challengeId === lab.id).map((use) => use.hintIndex),
    )
    const correctAttempts = challengeAttempts.filter((attempt) => attempt.correct)
    return {
      challengeId: lab.id,
      title: lab.title,
      attempts: challengeAttempts.length,
      incorrectAttempts: challengeAttempts.length - correctAttempts.length,
      solved: correctAttempts.length > 0,
      firstTrySolved: challengeAttempts[0]?.correct === true,
      hintsUsed: challengeHints.size,
      solvedAt: correctAttempts.length > 0 ? Math.min(...correctAttempts.map((attempt) => attempt.at)) : null,
      lastAttemptAt: challengeAttempts.length > 0
        ? challengeAttempts[challengeAttempts.length - 1].at
        : null,
    }
  })

  const totalAttempts = byChallenge.reduce((sum, row) => sum + row.attempts, 0)
  const incorrectAttempts = byChallenge.reduce((sum, row) => sum + row.incorrectAttempts, 0)
  const solvedChallenges = byChallenge.filter((row) => row.solved).length
  const correctAttempts = totalAttempts - incorrectAttempts
  return {
    totalChallenges: byChallenge.length,
    attemptedChallenges: byChallenge.filter((row) => row.attempts > 0).length,
    solvedChallenges,
    solveRatePct: byChallenge.length > 0 ? Math.round((solvedChallenges / byChallenge.length) * 100) : 0,
    totalAttempts,
    incorrectAttempts,
    attemptAccuracyPct: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
    firstTrySolved: byChallenge.filter((row) => row.firstTrySolved).length,
    hintsUsed: byChallenge.reduce((sum, row) => sum + row.hintsUsed, 0),
    byChallenge,
  }
}
