import { describe, expect, it } from 'vitest'
import type { Lab } from '../data/labs'
import { LABS } from '../data/labs'
import { validateLabRegistry } from './labRegistry'

const baseLab: Lab = {
  id: 'test-lab',
  title: 'Synthetic Lab',
  category: 'SOC',
  kind: 'dataset',
  glyph: '*',
  color: '#00f5ff',
  difficulty: 'easy',
  brief: 'Review synthetic evidence only.',
  scope: {
    allowed: ['The provided synthetic dataset'],
    forbidden: ['Any real host', 'Any real credentials'],
  },
  evidenceTitle: 'evidence.txt',
  evidence: 'src=203.0.113.10 user=alice@example.invalid result=FAIL',
  objectives: ['Classify the event'],
  rubric: {
    challengeType: 'test',
    passingScore: 80,
    hintPenalty: 2,
    scopeWarningPenalty: 5,
    components: [],
  },
  guiding: [{ q: 'What happened?', a: 'Use the synthetic evidence.' }],
  modelFindings: [{ title: 'Finding', severity: 'low', impact: 'Synthetic impact.', remediation: 'Synthetic remediation.' }],
}

describe('lab registry validation', () => {
  it('accepts the current seed lab registry', () => {
    expect(validateLabRegistry(LABS)).toEqual([])
  })

  it('rejects public IP metadata', () => {
    const errors = validateLabRegistry([{ ...baseLab, evidence: 'src=8.8.8.8 result=FAIL' }])
    expect(errors.some((error) => error.kind === 'public-ip')).toBe(true)
  })

  it('rejects real email metadata', () => {
    const errors = validateLabRegistry([{ ...baseLab, evidence: 'sender=person@gmail.com' }])
    expect(errors.some((error) => error.kind === 'real-email')).toBe(true)
  })

  it('rejects invalid lab kind', () => {
    const errors = validateLabRegistry([{ ...baseLab, kind: 'external' as Lab['kind'] }])
    expect(errors.some((error) => error.field === 'kind')).toBe(true)
  })
})
