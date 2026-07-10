import { describe, expect, it } from 'vitest'
import type { EvidenceItem, Report } from '../types'
import { reportToMarkdown } from './reportMarkdown'

const linked: EvidenceItem = {
  id: 'ev-linked',
  challengeId: 'soc-bruteforce',
  title: 'Synthetic authentication sequence',
  type: 'log',
  note: 'Prepared failures are followed by a successful event.',
  source: 'auth.log (synthetic)',
  reference: 'artifacts/auth-log.txt',
  timestamp: 1_783_630_800_000,
  createdAt: 1_783_630_800_000,
  updatedAt: 1_783_630_800_000,
}

const report: Report = {
  id: 'r-1',
  challengeId: 'soc-bruteforce',
  title: 'Synthetic SOC report',
  scope: 'Prepared dataset only.',
  summary: 'A synthetic event sequence needs review.',
  findings: [
    {
      id: 'f-1',
      title: 'Suspicious login sequence',
      severity: 'medium',
      impact: 'A fictional account may be affected.',
      remediation: 'Review the prepared controls.',
      evidence: 'Manual analyst note.',
      evidenceIds: [linked.id],
    },
  ],
  createdAt: 1_783_630_800_000,
  updatedAt: 1_783_630_800_000,
}

describe('report Markdown evidence citations', () => {
  it('quotes linked vault evidence and its file reference', () => {
    const markdown = reportToMarkdown(report, [linked])

    expect(markdown).toContain('**Evidence note:** Manual analyst note.')
    expect(markdown).toContain('**Evidence Vault citations:**')
    expect(markdown).toContain('Synthetic authentication sequence')
    expect(markdown).toContain('reference: artifacts/auth-log.txt')
    expect(markdown).toContain('Prepared failures are followed by a successful event.')
  })

  it('does not quote unlinked vault rows', () => {
    const unlinked = { ...linked, id: 'ev-unlinked', title: 'Unlinked item' }
    const markdown = reportToMarkdown(report, [linked, unlinked])

    expect(markdown).not.toContain('Unlinked item')
  })
})
