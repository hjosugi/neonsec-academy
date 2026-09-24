import { describe, expect, it } from 'vitest'
import samplePack from '../../seed_content/lab-packs/neon-starter-pack.json'
import { LABS } from '../data/labs'
import { UNSAFE_SAMPLE_LAB } from '../data/labAuditSamples'
import { compareVersions, installedPackFromPreview, previewLabPack } from './labPacks'

const shippedIds = LABS.map((lab) => lab.id)
const sample = JSON.stringify(samplePack)

describe('lab pack import preview', () => {
  it('accepts the bundled sample pack after local validation and audit', () => {
    const preview = previewLabPack(sample, '1.0.35', shippedIds)
    expect(preview.errors).toEqual([])
    expect(preview.ok).toBe(true)
    expect(preview.compatible).toBe(true)
    expect(preview.decisions.map((decision) => decision.publishable)).toEqual([true, true])
    const installed = installedPackFromPreview(preview, 5)!
    expect(installed).toMatchObject({ id: 'neon-starter-pack', version: '1.0.0', installedAt: 5 })
    expect(installed.labs).toHaveLength(2)
  })

  it('rejects an unsafe pack even when it claims a passing audit', () => {
    const unsafe = JSON.stringify({
      ...samplePack,
      id: 'unsafe-demo-pack',
      labs: [UNSAFE_SAMPLE_LAB],
      safetyAudit: { rulesetVersion: 1, auditedAt: '2026-09-25', results: [{ labId: UNSAFE_SAMPLE_LAB.id, status: 'pass', blockers: 0, warnings: 0 }] },
    })
    const preview = previewLabPack(unsafe, '1.0.35', shippedIds)
    expect(preview.ok).toBe(false)
    expect(preview.errors.join('\n')).toContain('failed the safety audit')
    expect(preview.errors.join('\n')).toContain('claims a passing audit but fails locally')
    expect(installedPackFromPreview(preview)).toBeNull()
  })

  it('refuses overrides, incompatible versions, missing audits, id collisions, and bad JSON', () => {
    const override = JSON.parse(sample)
    override.labs[0].safetyAudit = { rulesetVersion: 1, status: 'override', reviewedAt: '2026-09-25', reviewer: 'pack author', overrideNote: 'Trust me, this content is totally fine to import.', acceptedRules: ['public-ip'] }
    expect(previewLabPack(JSON.stringify(override), '1.0.35', shippedIds).errors.join('\n')).toContain('overrides are not accepted')

    expect(previewLabPack(sample, '1.0.20', shippedIds).errors.join('\n')).toContain('requires app 1.0.35 or newer')

    const noAudit = JSON.parse(sample)
    delete noAudit.safetyAudit
    expect(previewLabPack(JSON.stringify(noAudit), '1.0.35', shippedIds).errors.join('\n')).toContain('safetyAudit summary is required')

    const collision = JSON.parse(sample)
    collision.labs[0].id = 'soc-bruteforce'
    expect(previewLabPack(JSON.stringify(collision), '1.0.35', shippedIds).errors.join('\n')).toContain('collides with a shipped lab')

    expect(previewLabPack('{not json', '1.0.35').errors).toEqual(['Pack is not valid JSON.'])
    expect(previewLabPack(JSON.stringify({ format: 'other' }), '1.0.35').ok).toBe(false)
  })

  it('compares semantic versions', () => {
    expect(compareVersions('1.0.35', '1.0.4')).toBe(1)
    expect(compareVersions('1.2.0', '1.10.0')).toBe(-1)
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0)
    expect(Number.isNaN(compareVersions('v1', '1.0.0'))).toBe(true)
  })
})
