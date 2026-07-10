import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EvidenceItem, Report } from '../types'
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
  useStore.setState({ evidenceItems: [], reports: [] })
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
