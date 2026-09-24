import { describe, expect, it } from 'vitest'
import type { Lab } from '../data/labs'
import { LABS } from '../data/labs'
import { validateLabRegistry } from './labRegistry'
import { analysisCoverage } from './analysisChallenges'

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
  flagChallenge: {
    prompt: 'Classify the prepared event and submit a flag.',
    assets: [{ id: 'evidence', label: 'evidence.txt', kind: 'log', description: 'Synthetic event data.' }],
    expectedFlag: 'FLAG{SYNTHETIC_EVENT}',
    hints: ['Read the prepared result field.'],
    explanation: 'The prepared event is a safe schema example.',
    remediation: 'Keep analysis within the supplied dataset.',
    reportPrompt: 'Describe the event and defensive response.',
  },
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
  safetyAudit: { rulesetVersion: 1, status: 'pass', reviewedAt: '2026-09-24' },
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

  it('rejects missing or malformed flag challenge metadata', () => {
    const missing = validateLabRegistry([{ ...baseLab, flagChallenge: undefined } as unknown as Lab])
    const malformed = validateLabRegistry([
      { ...baseLab, flagChallenge: { ...baseLab.flagChallenge, expectedFlag: 'password spray', hints: [] } },
    ])

    expect(missing.some((error) => error.field === 'flagChallenge')).toBe(true)
    expect(malformed.some((error) => error.field === 'flagChallenge.expectedFlag')).toBe(true)
    expect(malformed.some((error) => error.field === 'flagChallenge.hints')).toBe(true)
  })

  it('rejects duplicate expected flags and duplicate asset ids', () => {
    const duplicateAssets: Lab = {
      ...baseLab,
      id: 'test-lab-2',
      flagChallenge: {
        ...baseLab.flagChallenge,
        assets: [...baseLab.flagChallenge.assets, { ...baseLab.flagChallenge.assets[0] }],
      },
    }
    const errors = validateLabRegistry([baseLab, duplicateAssets])

    expect(errors.some((error) => error.message === 'Expected flags must be unique.')).toBe(true)
    expect(errors.some((error) => error.message === 'Asset ids must be unique within a challenge.')).toBe(true)
  })

  it('ships at least five dataset-analysis challenge types with detection and prevention', () => {
    const coverage = analysisCoverage(LABS)
    for (const type of ['pcap', 'web-log', 'auth-log', 'cloud-config', 'firewall-rule'] as const) {
      expect(coverage[type]).toBeGreaterThanOrEqual(1)
    }
    const analysisLabs = LABS.filter((lab) => lab.analysis)
    expect(analysisLabs.length).toBeGreaterThanOrEqual(5)
    for (const lab of analysisLabs) {
      expect(lab.flagChallenge.explanation.trim()).not.toBe('')
      expect(lab.rubric.components.map((component) => component.key)).toEqual(
        expect.arrayContaining(['flag', 'evidence', 'remediation']),
      )
    }
  })

  it('rejects analysis metadata without a valid type, detection, or prevention', () => {
    const invalidType = validateLabRegistry([
      { ...baseLab, analysis: { type: 'netflow' as never, detection: 'Alert.', prevention: 'Fix.' } },
    ])
    const missingDetection = validateLabRegistry([
      { ...baseLab, analysis: { type: 'auth-log', detection: ' ', prevention: 'Enforce MFA.' } },
    ])

    expect(invalidType.some((error) => error.field === 'analysis.type')).toBe(true)
    expect(missingDetection.some((error) => error.field === 'analysis')).toBe(true)
  })

  it('scans analysis debrief text for unsafe targets', () => {
    const errors = validateLabRegistry([
      { ...baseLab, analysis: { type: 'web-log', detection: 'Compare with shop.acme.com traffic.', prevention: 'Block.' } },
    ])
    expect(errors.some((error) => error.kind === 'live-domain' && error.field === 'analysis.detection')).toBe(true)
  })

  it('requires web concept labs to warn about unsafe targets and use static exchanges', () => {
    const webLab: Lab = {
      ...baseLab,
      kind: 'simulated',
      webConcept: { concept: 'session', unsafeTargetWarning: ' ' },
    }
    const errors = validateLabRegistry([webLab])
    expect(errors.some((error) => error.field === 'webConcept.unsafeTargetWarning')).toBe(true)
    expect(errors.some((error) => error.message === 'Web concept labs must use a static request/response or headers asset.')).toBe(true)

    const liveKind = validateLabRegistry([{ ...webLab, kind: 'dataset', webConcept: { concept: 'cookies' as never, unsafeTargetWarning: 'Stay local.' } }])
    expect(liveKind.some((error) => error.field === 'webConcept.concept')).toBe(true)
    expect(liveKind.some((error) => error.field === 'kind')).toBe(true)
  })
})
