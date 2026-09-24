import { describe, expect, it } from 'vitest'
import { LABS, labById } from '../data/labs'
import type { Report } from '../types'
import {
  citeEvidenceInReport,
  createLabReport,
  evidenceFromLabLines,
  findLabReport,
  formatLineRange,
  labReportScope,
  labReportTitle,
  normalizeLineSelection,
} from './labReport'

const lab = labById('web-log-forced-browsing')!

describe('lab report helpers', () => {
  it('formats compact line ranges', () => {
    expect(formatLineRange([9, 3, 4, 5, 4])).toBe('L3-L5, L9')
    expect(formatLineRange([2])).toBe('L2')
    expect(formatLineRange([])).toBe('')
  })

  it('keeps only existing, unique artifact lines', () => {
    expect(normalizeLineSelection([0, 2, 2, 11, 1.5, 5], 10)).toEqual([2, 5])
  })

  it('builds a log evidence item from selected artifact lines', () => {
    const lines = lab.evidence.split('\n')
    const item = evidenceFromLabLines(lab, [9, 8, 42], 1_783_630_800_000)!

    expect(item).toMatchObject({
      challengeId: lab.id,
      type: 'log',
      source: lab.evidenceTitle,
      reference: `${lab.evidenceTitle} L8-L9`,
      timestamp: 1_783_630_800_000,
    })
    expect(item.note).toBe(`L8: ${lines[7].trim()}\nL9: ${lines[8].trim()}`)
    expect(evidenceFromLabLines(lab, [])).toBeNull()
    expect(evidenceFromLabLines(lab, [999])).toBeNull()
  })

  it('seeds lab reports from model findings and finds legacy reports', () => {
    const report = createLabReport(lab, 1_000)
    expect(report).toMatchObject({ challengeId: lab.id, title: labReportTitle(lab), scope: labReportScope(lab) })
    expect(report.findings).toHaveLength(lab.modelFindings.length)

    const legacy: Report = { ...report, id: 'legacy', challengeId: undefined }
    expect(findLabReport([legacy], lab)?.id).toBe('legacy')
    expect(findLabReport([legacy], LABS[0])).toBeUndefined()
  })

  it('cites evidence once, on the first finding by default or on a chosen finding', () => {
    const report = createLabReport(lab, 1_000)
    const first = citeEvidenceInReport(report, 'ev-1', undefined, 2_000)
    expect(first.findings[0].evidenceIds).toEqual(['ev-1'])
    expect(first.updatedAt).toBe(2_000)
    expect(citeEvidenceInReport(first, 'ev-1')).toBe(first)

    const second = citeEvidenceInReport(first, 'ev-2', report.findings[1].id)
    expect(second.findings[1].evidenceIds).toEqual(['ev-2'])
    expect(citeEvidenceInReport(second, 'ev-3', 'missing')).toBe(second)
  })
})
