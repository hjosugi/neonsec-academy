import { describe, expect, it } from 'vitest'
import { LABS, labById } from '../data/labs'
import {
  WEB_CONCEPT_KEYS,
  normalizeLabWorksheets,
  worksheetStatus,
  worksheetToFinding,
} from './webConcept'

const complete = {
  labId: 'web-session-rotation',
  finding: 'Session identifier SID-DEMO-7F3A survives login unchanged.',
  impact: 'A pre-login identifier grants the authenticated session.',
  remediation: 'Regenerate the identifier on login and set cookie attributes.',
  updatedAt: 1_783_630_800_000,
}

describe('web concept labs', () => {
  it('ship at least four static labs covering every concept, each requiring remediation', () => {
    const labs = LABS.filter((lab) => lab.webConcept)
    expect(labs.length).toBeGreaterThanOrEqual(4)
    expect(new Set(labs.map((lab) => lab.webConcept!.concept))).toEqual(new Set(WEB_CONCEPT_KEYS))
    for (const lab of labs) {
      expect(['simulated', 'local']).toContain(lab.kind)
      expect(lab.webConcept!.unsafeTargetWarning.trim()).not.toBe('')
      expect(lab.rubric.components.some((component) => component.key === 'remediation' && component.points > 0)).toBe(true)
      expect(lab.objectives.some((objective) => /remediation/i.test(objective) || /fix/i.test(objective))).toBe(true)
    }
  })

  it('reports missing worksheet fields until each has enough detail', () => {
    expect(worksheetStatus(undefined)).toEqual({ complete: false, missing: ['finding', 'impact', 'remediation'] })
    expect(worksheetStatus({ ...complete, impact: 'too short' }).missing).toEqual(['impact'])
    expect(worksheetStatus(complete).complete).toBe(true)
  })

  it('normalizes worksheets: unknown labs dropped, newest row per lab kept, text trimmed', () => {
    const rows = normalizeLabWorksheets([
      complete,
      { ...complete, finding: '  newer finding text for the same lab  ', updatedAt: complete.updatedAt + 1 },
      { ...complete, labId: 'unknown-lab' },
      { ...complete, labId: 'web-idor', updatedAt: 'yesterday' },
      'garbage',
    ], LABS)
    expect(rows).toHaveLength(1)
    expect(rows[0].finding).toBe('newer finding text for the same lab')
    expect(normalizeLabWorksheets(null, LABS)).toEqual([])
  })

  it('turns a worksheet into a report finding', () => {
    const finding = worksheetToFinding(complete, labById('web-session-rotation')!, 'high')
    expect(finding).toMatchObject({
      title: complete.finding,
      severity: 'high',
      impact: complete.impact,
      remediation: complete.remediation,
      evidenceIds: [],
    })
    expect(finding.evidence).toContain('Learner worksheet')
  })
})
