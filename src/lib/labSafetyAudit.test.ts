import { describe, expect, it } from 'vitest'
import { LABS } from '../data/labs'
import { SAFE_SAMPLE_LAB, UNSAFE_SAMPLE_LAB } from '../data/labAuditSamples'
import {
  AUDIT_RULES,
  AUDIT_RULESET_VERSION,
  auditFields,
  auditLab,
  auditRecordProblems,
  auditReportToMarkdown,
  publishDecision,
  publishGate,
} from './labSafetyAudit'

describe('lab safety audit publish gate', () => {
  it('publishes every shipped lab with a current pass record', () => {
    const gate = publishGate(LABS)
    expect(gate.rejected.map((decision) => [decision.targetId, decision.reasons, decision.report.findings])).toEqual([])
    expect(gate.publishable).toHaveLength(LABS.length)
  })

  it('accepts the safe sample and rejects the unsafe sample with every expected rule', () => {
    expect(publishDecision(SAFE_SAMPLE_LAB)).toMatchObject({ publishable: true, status: 'pass' })
    const unsafe = publishDecision(UNSAFE_SAMPLE_LAB)
    expect(unsafe.publishable).toBe(false)
    expect(unsafe.status).toBe('fail')
    expect(new Set(unsafe.report.findings.map((finding) => finding.rule))).toEqual(new Set([
      'forbidden-target',
      'forbidden-activity',
      'public-ip',
      'real-domain',
      'credential-field',
      'live-malware',
      'attack-payload',
    ]))
    expect(unsafe.report.findings.every((finding) => finding.safeAlternative.length > 20)).toBe(true)
  })

  it('suggests a safe alternative for every rule', () => {
    for (const rule of Object.values(AUDIT_RULES)) {
      expect(rule.safeAlternative.trim().length).toBeGreaterThan(20)
      expect(rule.category.trim()).not.toBe('')
    }
  })

  it('requires a current stored audit record', () => {
    expect(auditRecordProblems(undefined)).toHaveLength(1)
    const stale = publishDecision({ ...SAFE_SAMPLE_LAB, safetyAudit: { rulesetVersion: 0, status: 'pass', reviewedAt: '2026-01-01' } })
    expect(stale.publishable).toBe(false)
    expect(stale.reasons[0]).toContain(`v${AUDIT_RULESET_VERSION}`)
  })

  it('requires a safety review note, reviewer, and full rule coverage for manual overrides', () => {
    const blockerRules = [...new Set(auditLab(UNSAFE_SAMPLE_LAB).findings.map((finding) => finding.rule))]
    const noNote = publishDecision({
      ...UNSAFE_SAMPLE_LAB,
      safetyAudit: { rulesetVersion: AUDIT_RULESET_VERSION, status: 'override', reviewedAt: '2026-09-24', acceptedRules: blockerRules },
    })
    expect(noNote.publishable).toBe(false)
    expect(noNote.reasons.join(' ')).toContain('safety review note')

    const partial = publishDecision({
      ...UNSAFE_SAMPLE_LAB,
      safetyAudit: {
        rulesetVersion: AUDIT_RULESET_VERSION,
        status: 'override',
        reviewedAt: '2026-09-24',
        reviewer: 'Safety reviewer',
        overrideNote: 'Reviewed: fixture content is fictional and never rendered to learners.',
        acceptedRules: ['public-ip'],
      },
    })
    expect(partial.publishable).toBe(false)
    expect(partial.reasons.join(' ')).toContain('Override does not cover')

    const documented = publishDecision({
      ...UNSAFE_SAMPLE_LAB,
      safetyAudit: {
        rulesetVersion: AUDIT_RULESET_VERSION,
        status: 'override',
        reviewedAt: '2026-09-24',
        reviewer: 'Safety reviewer',
        overrideNote: 'Reviewed: fixture content is fictional and never rendered to learners.',
        acceptedRules: blockerRules,
      },
    })
    expect(documented).toMatchObject({ publishable: true, status: 'override' })
  })

  it('treats artifacts as code/logs: member access is fine, real hosts are not', () => {
    const artifact = auditFields([{ field: 'artifact', mode: 'artifact', text: 'const id = req.params.id\nres.json(user.profile)\nfetch("https://api.realcorp.com/v1")\nconst host = "billing.acme.com"' }])
    expect(artifact.map((finding) => [finding.rule, finding.value])).toEqual([
      ['real-domain', 'https://api.realcorp.com/v1'],
      ['real-domain', 'billing.acme.com'],
    ])
  })

  it('only flags learner instructions that perform attacks or target real systems', () => {
    const safe = auditFields([{ field: 'objectives', mode: 'prose', instruction: true, text: 'Recommend an immediate containment action\nIdentify the pivot event\nThe forbidden list excludes any real host' }])
    expect(safe).toEqual([])
    const unsafe = auditFields([{ field: 'objectives', mode: 'prose', instruction: true, text: 'Exploit the login form\nUse the production database' }])
    expect(unsafe.map((finding) => finding.rule)).toEqual(['forbidden-activity', 'forbidden-target'])
  })

  it('renders a Markdown audit report', () => {
    const markdown = auditReportToMarkdown([publishDecision(SAFE_SAMPLE_LAB), publishDecision(UNSAFE_SAMPLE_LAB)])
    expect(markdown).toContain('| Audit Sample: Synthetic DNS Review | pass | 0 | 0 |')
    expect(markdown).toContain('suggestion:')
  })
})
