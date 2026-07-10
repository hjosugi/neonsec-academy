import { describe, expect, it } from 'vitest'
import type { EvidenceItem, Finding, Report } from '../types'
import {
  evidenceForChallenge,
  linkedEvidenceForFinding,
  normalizeEvidenceItem,
  normalizeEvidenceItems,
  reconcileReportEvidenceLinks,
} from './evidence'

function item(patch: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 'ev-1',
    challengeId: 'soc-bruteforce',
    title: 'Synthetic login sequence',
    type: 'log',
    note: 'The prepared log shows repeated failures before one successful login.',
    source: 'auth.log (synthetic)',
    reference: 'artifacts/auth-log.txt',
    timestamp: 1_783_630_800_000,
    createdAt: 1_783_630_800_000,
    updatedAt: 1_783_630_800_000,
    ...patch,
  }
}

describe('evidence vault helpers', () => {
  it('normalizes valid backup rows and trims text', () => {
    expect(normalizeEvidenceItem({ ...item(), title: '  Synthetic login sequence  ' })).toEqual(item())
  })

  it('rejects incomplete and invalid evidence rows', () => {
    expect(normalizeEvidenceItem({ ...item(), note: '' })).toBeNull()
    expect(normalizeEvidenceItem({ ...item(), type: 'credential-dump' })).toBeNull()
    expect(normalizeEvidenceItem({ ...item(), timestamp: Number.NaN })).toBeNull()
    expect(normalizeEvidenceItem({ ...item(), timestamp: Number.MAX_VALUE })).toBeNull()
  })

  it('deduplicates IDs and sorts challenge evidence newest first', () => {
    const rows = normalizeEvidenceItems([
      item({ id: 'ev-old', timestamp: 100 }),
      item({ id: 'ev-new', timestamp: 300 }),
      item({ id: 'ev-other', challengeId: 'cloud-iam', timestamp: 400 }),
      item({ id: 'ev-old', title: 'Updated title', timestamp: 200 }),
    ])

    expect(evidenceForChallenge(rows, 'soc-bruteforce').map((row) => row.id)).toEqual(['ev-new', 'ev-old'])
    expect(rows.find((row) => row.id === 'ev-old')?.title).toBe('Updated title')
  })

  it('resolves unique finding links in their saved citation order and ignores missing IDs', () => {
    const finding: Finding = {
      id: 'f-1',
      title: 'Finding',
      severity: 'medium',
      impact: 'Synthetic impact.',
      remediation: 'Synthetic remediation.',
      evidence: '',
      evidenceIds: ['ev-2', 'missing', 'ev-1', 'ev-2'],
    }
    const items = [item(), item({ id: 'ev-2', title: 'Second item' })]

    expect(linkedEvidenceForFinding(finding, items).map((row) => row.id)).toEqual(['ev-2', 'ev-1'])
  })

  it('removes missing, duplicate, and cross-challenge report links', () => {
    const report: Report = {
      id: 'r-1',
      challengeId: '  soc-bruteforce  ',
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
          evidenceIds: ['ev-1', 'missing', 'ev-other', 'ev-1'],
        },
      ],
      createdAt: 100,
      updatedAt: 100,
    }
    const items = [item(), item({ id: 'ev-other', challengeId: 'cloud-iam' })]

    const [normalized] = reconcileReportEvidenceLinks([report], items)

    expect(normalized.challengeId).toBe('soc-bruteforce')
    expect(normalized.findings[0].evidenceIds).toEqual(['ev-1'])
  })

  it('allows standalone reports to cite evidence from multiple challenges', () => {
    const report: Report = {
      id: 'r-standalone',
      title: 'Cross-lab summary',
      scope: 'Synthetic material only.',
      summary: 'Synthetic summary.',
      findings: [
        {
          id: 'f-1',
          title: 'Finding',
          severity: 'info',
          impact: 'Synthetic impact.',
          remediation: 'Synthetic remediation.',
          evidence: '',
          evidenceIds: ['ev-1', 'ev-other'],
        },
      ],
      createdAt: 100,
      updatedAt: 100,
    }
    const items = [item(), item({ id: 'ev-other', challengeId: 'cloud-iam' })]

    const [normalized] = reconcileReportEvidenceLinks([report], items)

    expect(normalized.findings[0].evidenceIds).toEqual(['ev-1', 'ev-other'])
  })
})
