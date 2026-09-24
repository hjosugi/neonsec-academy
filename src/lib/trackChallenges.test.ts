import { describe, expect, it } from 'vitest'
import { TRACK_CHALLENGES, trackChallengeById } from '../data/tracks'
import { SEED_QUESTIONS } from '../data/questions'
import type { TrackChallenge } from '../data/tracks/types'
import {
  auditTrackChallenge,
  gradeTrackDraft,
  normalizeTrackSubmissions,
  timelineFromLines,
  trackQuestionId,
  trackStats,
  validateTrackChallenges,
} from './trackChallenges'

function perfectDraft(challenge: TrackChallenge) {
  return {
    selectedLines: [...challenge.answerLines],
    classification: challenge.classification.answer,
    writeups: Object.fromEntries(challenge.writeups.map((item) => [item.key, item.model])),
  }
}

describe('track challenge content', () => {
  it('passes schema, track-specific, and safety validation', () => {
    expect(validateTrackChallenges(TRACK_CHALLENGES)).toEqual([])
    for (const challenge of TRACK_CHALLENGES) {
      expect(auditTrackChallenge(challenge).filter((finding) => finding.severity === 'blocker')).toEqual([])
    }
  })

  it('ships at least ten AppSec code review challenges across all five categories with fix explanations', () => {
    const appsec = TRACK_CHALLENGES.filter((challenge) => challenge.track === 'appsec')
    expect(appsec.length).toBeGreaterThanOrEqual(10)
    expect(new Set(appsec.map((challenge) => challenge.category))).toEqual(
      new Set(['authz', 'input-validation', 'secrets-handling', 'error-handling', 'dependency-risk']),
    )
    for (const challenge of appsec) {
      expect(challenge.kind).toBe('code-review')
      expect(challenge.writeups.map((item) => item.key)).toEqual(['impact', 'fix'])
      expect(challenge.safeFix?.length).toBeGreaterThan(0)
      expect(challenge.testIdea?.length).toBeGreaterThan(20)
    }
  })

  it('ships at least eight cloud config reviews with risk, remediation, and least privilege', () => {
    const cloud = TRACK_CHALLENGES.filter((challenge) => challenge.track === 'cloud')
    expect(cloud.length).toBeGreaterThanOrEqual(8)
    expect(new Set(cloud.map((challenge) => challenge.category))).toEqual(
      new Set(['iam-over-permission', 'public-exposure', 'weak-logging', 'missing-encryption', 'secret-handling']),
    )
    for (const challenge of cloud) {
      expect(challenge.kind).toBe('config-review')
      expect(challenge.cehModules).toContain(19)
      expect(challenge.writeups.map((item) => item.key)).toEqual(['risk', 'remediation'])
      expect(challenge.leastPrivilege?.length).toBeGreaterThan(40)
      expect(challenge.remediation.length).toBeGreaterThan(20)
    }
  })

  it('reports cloud track weakness stats by category', () => {
    const cloud = TRACK_CHALLENGES.filter((challenge) => challenge.track === 'cloud')
    const wrong = cloud.find((challenge) => challenge.category === 'public-exposure')!
    const right = cloud.find((challenge) => challenge.category === 'weak-logging')!
    const submissions = normalizeTrackSubmissions([
      { id: 'c1', challengeId: wrong.id, at: 1, ...perfectDraft(wrong), classification: 'wrong' },
      { id: 'c2', challengeId: right.id, at: 2, ...perfectDraft(right) },
    ], TRACK_CHALLENGES)
    const stats = trackStats(TRACK_CHALLENGES, submissions, 'cloud')
    expect(stats.total).toBe(cloud.length)
    expect(stats.byCategory.find((row) => row.key === 'public-exposure')).toMatchObject({ attempted: 1, solved: 0, accuracyPct: 0 })
    expect(stats.byCategory.find((row) => row.key === 'weak-logging')).toMatchObject({ attempted: 1, solved: 1, accuracyPct: 100 })
    expect(stats.weakest[0].key).toBe('public-exposure')
  })

  it('compiles every challenge into a module-0 review question', () => {
    for (const challenge of TRACK_CHALLENGES) {
      const question = SEED_QUESTIONS.find((item) => item.id === trackQuestionId(challenge))
      expect(question).toMatchObject({ module: 0, track: challenge.track, type: 'mcq', answer: challenge.classification.answer })
    }
  })

  it('rejects inconsistent or unsafe challenges', () => {
    const base = TRACK_CHALLENGES[0]
    const broken: TrackChallenge = {
      ...base,
      id: 'bad id',
      answerLines: [999],
      classification: { ...base.classification, answer: 'not an option' },
      safeFix: undefined,
      artifact: { ...base.artifact, lines: [...base.artifact.lines, 'fetch("https://api.realcorp.com/export")'] },
    }
    const messages = validateTrackChallenges([broken]).map((problem) => problem.message)
    expect(messages).toEqual(expect.arrayContaining([
      'Id must look like TRACK-01.',
      'Answer line 999 is outside the artifact.',
      'Classification answer must be one of the options.',
      'AppSec challenges need a safe fix and a unit-test idea.',
    ]))
    expect(messages.some((message) => message.startsWith('Safety audit:'))).toBe(true)
  })
})

describe('track challenge grading', () => {
  const challenge = trackChallengeById('APPSEC-01')!

  it('awards full credit for the right lines, class, and writeups', () => {
    expect(gradeTrackDraft(challenge, perfectDraft(challenge))).toMatchObject({ correct: true, scorePct: 100, linesCorrect: true })
  })

  it('tolerates one extra context line but not missed lines or a wrong class', () => {
    const extra = gradeTrackDraft(challenge, { ...perfectDraft(challenge), selectedLines: [...challenge.answerLines, 1] })
    expect(extra.correct).toBe(true)
    const missed = gradeTrackDraft(challenge, { ...perfectDraft(challenge), selectedLines: [1, 2] })
    expect(missed).toMatchObject({ correct: false, linesCorrect: false })
    const wrongClass = gradeTrackDraft(challenge, { ...perfectDraft(challenge), classification: challenge.classification.options.find((option) => option !== challenge.classification.answer)! })
    expect(wrongClass).toMatchObject({ correct: false, scorePct: 70 })
    const noWriteups = gradeTrackDraft(challenge, { ...perfectDraft(challenge), writeups: { impact: 'short' } })
    expect(noWriteups).toMatchObject({ correct: true, writeupsComplete: false, missingWriteups: ['impact', 'fix'], scorePct: 70 })
  })

  it('computes weakness stats by category and skill from the latest submission', () => {
    const [first, second] = TRACK_CHALLENGES.filter((item) => item.track === 'appsec')
    const submissions = normalizeTrackSubmissions([
      { id: 's1', challengeId: first.id, at: 1, ...perfectDraft(first), classification: 'wrong' },
      { id: 's2', challengeId: first.id, at: 2, ...perfectDraft(first) },
      { id: 's3', challengeId: second.id, at: 3, ...perfectDraft(second), selectedLines: [] },
      { id: 's4', challengeId: 'UNKNOWN-01', at: 4 },
    ], TRACK_CHALLENGES)
    expect(submissions.map((item) => item.id)).toEqual(['s1', 's2', 's3'])
    const stats = trackStats(TRACK_CHALLENGES, submissions, 'appsec')
    expect(stats).toMatchObject({ attempted: 2, solved: 1 })
    expect(stats.byCategory.find((row) => row.key === first.category)).toMatchObject({ attempted: first.category === second.category ? 2 : 1 })
  })

  it('builds timeline rows only for timestamped lines', () => {
    const fake: TrackChallenge = {
      ...challenge,
      artifact: { ...challenge.artifact, lines: ['2026-03-14T02:11:09Z event=a', 'no time here', '2026-03-14T02:10:00Z event=b'] },
    }
    expect(timelineFromLines(fake, [1, 2, 3])).toEqual([
      { time: '2026-03-14T02:10:00Z', line: 3, observation: '' },
      { time: '2026-03-14T02:11:09Z', line: 1, observation: '' },
    ])
  })
})
