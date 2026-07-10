import { describe, expect, it } from 'vitest'
import { LABS } from '../data/labs'
import type { FlagAttempt, FlagHintUse } from '../types'
import {
  canonicalFlag,
  computeFlagChallengeAnalytics,
  isExpectedFlagValid,
  isFlagCorrect,
  normalizeFlagAttempts,
  normalizeFlagHintUses,
  sanitizeFlagSubmission,
} from './flagChallenge'

const soc = LABS.find((lab) => lab.id === 'soc-bruteforce')!
const cloud = LABS.find((lab) => lab.id === 'cloud-iam')!

describe('flag challenge engine', () => {
  it('normalizes case and surrounding whitespace for comparison', () => {
    expect(canonicalFlag('  flag{password_spray}  ')).toBe('FLAG{PASSWORD_SPRAY}')
    expect(isFlagCorrect(soc.flagChallenge, ' flag{password_spray} ')).toBe(true)
    expect(isFlagCorrect(soc.flagChallenge, 'FLAG{BRUTE_FORCE}')).toBe(false)
  })

  it('validates authored flags and rejects unsafe submissions', () => {
    expect(isExpectedFlagValid('FLAG{PASSWORD_SPRAY}')).toBe(true)
    expect(isExpectedFlagValid('flag{password_spray}')).toBe(false)
    expect(isExpectedFlagValid('password spray')).toBe(false)
    expect(sanitizeFlagSubmission('')).toBeNull()
    expect(sanitizeFlagSubmission('FLAG{BAD}\nFLAG{SECOND}')).toBeNull()
    expect(sanitizeFlagSubmission('x'.repeat(161))).toBeNull()
  })

  it('normalizes attempts, recalculates correctness, and rejects unknown challenges', () => {
    const attempts = normalizeFlagAttempts([
      {
        id: 'wrong',
        challengeId: soc.id,
        submitted: 'FLAG{BRUTE_FORCE}',
        correct: true,
        hintCount: 99,
        at: 100,
      },
      {
        id: 'correct',
        challengeId: soc.id,
        submitted: ' flag{password_spray} ',
        correct: false,
        hintCount: 1,
        at: 200,
      },
      {
        id: 'unknown',
        challengeId: 'missing-lab',
        submitted: 'FLAG{UNKNOWN}',
        correct: true,
        hintCount: 0,
        at: 300,
      },
    ], LABS)

    expect(attempts).toEqual([
      {
        id: 'wrong',
        challengeId: soc.id,
        submitted: 'FLAG{BRUTE_FORCE}',
        correct: false,
        hintCount: soc.flagChallenge.hints.length,
        at: 100,
      },
      {
        id: 'correct',
        challengeId: soc.id,
        submitted: 'flag{password_spray}',
        correct: true,
        hintCount: 1,
        at: 200,
      },
    ])
  })

  it('deduplicates hint use and preserves the earliest valid timestamp', () => {
    const hints = normalizeFlagHintUses([
      { challengeId: soc.id, hintIndex: 0, usedAt: 300 },
      { challengeId: soc.id, hintIndex: 0, usedAt: 100 },
      { challengeId: soc.id, hintIndex: 99, usedAt: 200 },
      { challengeId: 'missing-lab', hintIndex: 0, usedAt: 200 },
    ], LABS)

    expect(hints).toEqual([{ challengeId: soc.id, hintIndex: 0, usedAt: 100 }])
  })

  it('summarizes challenge results for Analytics', () => {
    const attempts: FlagAttempt[] = [
      { id: 'a-1', challengeId: soc.id, submitted: 'FLAG{NOPE}', correct: false, hintCount: 1, at: 100 },
      { id: 'a-2', challengeId: soc.id, submitted: soc.flagChallenge.expectedFlag, correct: true, hintCount: 1, at: 200 },
      { id: 'a-3', challengeId: cloud.id, submitted: cloud.flagChallenge.expectedFlag, correct: true, hintCount: 0, at: 300 },
    ]
    const hintUses: FlagHintUse[] = [
      { challengeId: soc.id, hintIndex: 0, usedAt: 50 },
      { challengeId: soc.id, hintIndex: 1, usedAt: 150 },
    ]

    const analytics = computeFlagChallengeAnalytics([soc, cloud], attempts, hintUses)

    expect(analytics).toMatchObject({
      totalChallenges: 2,
      attemptedChallenges: 2,
      solvedChallenges: 2,
      solveRatePct: 100,
      totalAttempts: 3,
      incorrectAttempts: 1,
      attemptAccuracyPct: 67,
      firstTrySolved: 1,
      hintsUsed: 2,
    })
    expect(analytics.byChallenge.find((row) => row.challengeId === soc.id)).toMatchObject({
      attempts: 2,
      solved: true,
      firstTrySolved: false,
      hintsUsed: 2,
      solvedAt: 200,
    })
  })
})
