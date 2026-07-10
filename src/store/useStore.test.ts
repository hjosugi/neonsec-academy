import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EvidenceItem, Report } from '../types'
import { LABS } from '../data/labs'
import { mergePersistedStoreState, useStore } from './useStore'

const evidence: EvidenceItem = {
  id: 'ev-persisted',
  challengeId: 'soc-bruteforce',
  title: 'Persisted synthetic observation',
  type: 'observation',
  note: 'A prepared event is visible in the supplied artifact.',
  source: 'synthetic artifact',
  reference: 'screenshots/observation-01.png',
  timestamp: 1_783_630_800_000,
  createdAt: 1_783_630_800_000,
  updatedAt: 1_783_630_800_000,
}

beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
})

beforeEach(() => {
  useStore.setState({ flagAttempts: [], flagHintUses: [], evidenceItems: [], reports: [] })
})

afterAll(() => {
  vi.restoreAllMocks()
})

describe('evidence store persistence', () => {
  it('includes evidence in private backup export and import', () => {
    useStore.getState().upsertEvidence(evidence)
    const saved = useStore.getState().evidenceItems[0]
    const backup = useStore.getState().exportData()
    useStore.setState({ evidenceItems: [] })

    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().evidenceItems).toEqual([saved])
  })

  it('removes deleted evidence links from report findings', () => {
    const report: Report = {
      id: 'r-1',
      challengeId: evidence.challengeId,
      title: 'Synthetic report',
      scope: 'Prepared material only.',
      summary: 'Synthetic summary.',
      findings: [
        {
          id: 'f-1',
          title: 'Finding',
          severity: 'low',
          impact: 'Synthetic impact.',
          remediation: 'Synthetic remediation.',
          evidence: '',
          evidenceIds: [evidence.id],
        },
      ],
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    }
    useStore.getState().upsertEvidence(evidence)
    useStore.getState().upsertReport(report)

    useStore.getState().deleteEvidence(evidence.id)

    expect(useStore.getState().evidenceItems).toEqual([])
    expect(useStore.getState().reports[0].findings[0].evidenceIds).toEqual([])
  })

  it('keeps an existing evidence item in its original challenge', () => {
    useStore.getState().upsertEvidence(evidence)
    const saved = useStore.getState().evidenceItems[0]

    useStore.getState().upsertEvidence({ ...saved, challengeId: 'cloud-iam', title: 'Edited title' })

    expect(useStore.getState().evidenceItems[0]).toMatchObject({
      challengeId: evidence.challengeId,
      title: 'Edited title',
    })
  })

  it('normalizes imported rows and prunes invalid report links', () => {
    const otherChallenge = { ...evidence, id: 'ev-other', challengeId: 'cloud-iam' }
    const report: Report = {
      id: 'r-imported',
      challengeId: evidence.challengeId,
      title: 'Imported synthetic report',
      scope: 'Prepared material only.',
      summary: 'Synthetic summary.',
      findings: [
        {
          id: 'f-imported',
          title: 'Finding',
          severity: 'low',
          impact: 'Synthetic impact.',
          remediation: 'Synthetic remediation.',
          evidence: '',
          evidenceIds: [evidence.id, evidence.id, otherChallenge.id, 'missing'],
        },
      ],
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    }
    const backup = JSON.stringify({
      evidenceItems: [evidence, otherChallenge, { ...evidence, id: 'invalid', note: '' }],
      reports: [report],
    })

    expect(useStore.getState().importData(backup)).toBe(true)
    expect(useStore.getState().evidenceItems).toHaveLength(2)
    expect(useStore.getState().reports[0].findings[0].evidenceIds).toEqual([evidence.id])
  })

  it('normalizes Evidence Vault data during persisted-state hydration', () => {
    const report: Report = {
      id: 'r-hydrated',
      challengeId: evidence.challengeId,
      title: 'Hydrated synthetic report',
      scope: 'Prepared material only.',
      summary: 'Synthetic summary.',
      findings: [
        {
          id: 'f-hydrated',
          title: 'Finding',
          severity: 'info',
          impact: 'Synthetic impact.',
          remediation: 'Synthetic remediation.',
          evidence: '',
          evidenceIds: [evidence.id, 'missing'],
        },
      ],
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
    }
    const hydrated = mergePersistedStoreState(
      {
        evidenceItems: [evidence, { ...evidence, id: 'invalid', timestamp: Number.MAX_VALUE }],
        reports: [report],
      },
      useStore.getState(),
    )

    expect(hydrated.evidenceItems).toEqual([evidence])
    expect(hydrated.reports[0].findings[0].evidenceIds).toEqual([evidence.id])
  })
})

describe('flag challenge persistence', () => {
  const challenge = LABS.find((lab) => lab.id === 'soc-bruteforce')!

  it('records wrong and correct attempts, then locks a solved challenge', () => {
    expect(useStore.getState().submitLabFlag(challenge.id, '')).toBeNull()
    expect(useStore.getState().submitLabFlag('missing-lab', 'FLAG{UNKNOWN}')).toBeNull()
    const wrong = useStore.getState().submitLabFlag(challenge.id, 'FLAG{BRUTE_FORCE}')
    const correct = useStore.getState().submitLabFlag(challenge.id, ' flag{password_spray} ')
    const afterSolve = useStore.getState().submitLabFlag(challenge.id, challenge.flagChallenge.expectedFlag)

    expect(wrong).toMatchObject({ challengeId: challenge.id, correct: false, hintCount: 0 })
    expect(correct).toMatchObject({ challengeId: challenge.id, correct: true, hintCount: 0 })
    expect(afterSolve).toBeNull()
    expect(useStore.getState().revealLabFlagHint(challenge.id, 0)).toBe(false)
    expect(useStore.getState().flagAttempts).toHaveLength(2)
  })

  it('records each valid hint only once and snapshots hint count on attempts', () => {
    expect(useStore.getState().revealLabFlagHint(challenge.id, 0)).toBe(true)
    expect(useStore.getState().revealLabFlagHint(challenge.id, 0)).toBe(false)
    expect(useStore.getState().revealLabFlagHint(challenge.id, 99)).toBe(false)

    const attempt = useStore.getState().submitLabFlag(challenge.id, 'FLAG{NOT_YET}')

    expect(useStore.getState().flagHintUses).toHaveLength(1)
    expect(attempt?.hintCount).toBe(1)
  })

  it('round-trips flag history in private backups and recalculates correctness on import', () => {
    useStore.getState().revealLabFlagHint(challenge.id, 0)
    useStore.getState().submitLabFlag(challenge.id, challenge.flagChallenge.expectedFlag)
    const backup = JSON.parse(useStore.getState().exportData())
    backup.flagAttempts[0].correct = false
    useStore.setState({ flagAttempts: [], flagHintUses: [] })

    expect(useStore.getState().importData(JSON.stringify(backup))).toBe(true)
    expect(useStore.getState().flagAttempts[0].correct).toBe(true)
    expect(useStore.getState().flagHintUses).toHaveLength(1)
  })

  it('normalizes flag state during browser hydration', () => {
    const hydrated = mergePersistedStoreState(
      {
        flagAttempts: [
          {
            id: 'fa-imported',
            challengeId: challenge.id,
            submitted: challenge.flagChallenge.expectedFlag,
            correct: false,
            hintCount: 0,
            at: 100,
          },
          { id: 'invalid', challengeId: 'missing', submitted: 'FLAG{UNKNOWN}', at: 200 },
        ],
        flagHintUses: [
          { challengeId: challenge.id, hintIndex: 0, usedAt: 50 },
          { challengeId: challenge.id, hintIndex: 99, usedAt: 60 },
        ],
      },
      useStore.getState(),
    )

    expect(hydrated.flagAttempts).toHaveLength(1)
    expect(hydrated.flagAttempts[0].correct).toBe(true)
    expect(hydrated.flagHintUses).toEqual([{ challengeId: challenge.id, hintIndex: 0, usedAt: 50 }])
  })
})
