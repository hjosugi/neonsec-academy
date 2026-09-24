import { describe, expect, it } from 'vitest'
import { THREAT_MODEL_SCENARIOS } from '../data/tracks/threatModel'
import type { ThreatModelWork } from '../types'
import { auditFields } from './labSafetyAudit'
import { reportQualityChecklist } from './reportQuality'
import {
  backlogToMarkdown,
  blankThreatModelWork,
  normalizeThreatModelWork,
  remediationBacklog,
  reviewThreatModel,
  suggestedCehConcept,
  threatModelReport,
} from './threatModel'

const scenario = THREAT_MODEL_SCENARIOS[0]

function modelWork(): ThreatModelWork {
  const work = blankThreatModelWork(scenario, 1)
  for (const asset of scenario.assets) work.assetRatings[asset.id] = asset.sensitivity
  for (const boundary of scenario.boundaries) work.boundaryNotes[boundary.id] = `Authenticate and validate everything crossing ${boundary.name}.`
  work.threats = scenario.modelThreats.map((threat, index) => ({
    id: `t${index}`,
    target: threat.target,
    stride: threat.stride,
    threat: threat.threat,
    mitigation: threat.mitigation,
    priority: threat.priority,
    status: index === 0 ? 'done' : 'todo',
  }))
  return work
}

describe('threat modeling content', () => {
  it('ships at least five consistent, safe scenarios', () => {
    expect(THREAT_MODEL_SCENARIOS.length).toBeGreaterThanOrEqual(5)
    for (const item of THREAT_MODEL_SCENARIOS) {
      const components = new Set(item.components.map((component) => component.id))
      const flows = new Set(item.dataFlows.map((flow) => flow.id))
      const boundaries = new Set(item.boundaries.map((boundary) => boundary.id))
      for (const flow of item.dataFlows) {
        expect(components.has(flow.from) && components.has(flow.to)).toBe(true)
        if (flow.boundary) expect(boundaries.has(flow.boundary)).toBe(true)
      }
      for (const threat of item.modelThreats) {
        expect(components.has(threat.target) || flows.has(threat.target)).toBe(true)
        expect(threat.cehConcept).toMatch(/\(M\d+\)/)
      }
      for (const key of item.requiredStride) expect(item.modelThreats.some((threat) => threat.stride === key)).toBe(true)
      const text = [item.system, ...item.diagram, ...item.modelThreats.map((threat) => `${threat.threat}\n${threat.mitigation}`)].join('\n')
      expect(auditFields([{ field: item.id, text, mode: 'prose' }]).filter((finding) => finding.severity === 'blocker')).toEqual([])
    }
  })
})

describe('threat model workflow', () => {
  it('is complete when assets, boundaries, and required STRIDE categories are covered', () => {
    expect(reviewThreatModel(scenario, blankThreatModelWork(scenario)).complete).toBe(false)
    const review = reviewThreatModel(scenario, modelWork())
    expect(review).toMatchObject({ complete: true, assetAccuracyPct: 100, strideMissing: [] })
  })

  it('reports missing STRIDE coverage and incomplete threats', () => {
    const work = modelWork()
    work.threats = work.threats.filter((threat) => threat.stride !== 'R')
    work.threats.push({ id: 'x', target: scenario.components[0].id, stride: 'T', threat: 'short', mitigation: '', priority: 'P3', status: 'todo' })
    const review = reviewThreatModel(scenario, work)
    expect(review.strideMissing).toEqual(['R'])
    expect(review.incompleteThreats).toEqual(['x'])
    expect(review.complete).toBe(false)
  })

  it('builds a prioritized backlog, Markdown, and a report with CEH links', () => {
    const work = modelWork()
    const backlog = remediationBacklog(work)
    expect(backlog.map((threat) => threat.priority)).toEqual([...backlog.map((threat) => threat.priority)].sort())
    expect(suggestedCehConcept(scenario, backlog[0])).toBeTruthy()
    const markdown = backlogToMarkdown(scenario, work)
    expect(markdown).toContain('| # | Priority | Status | STRIDE | Target | Mitigation | CEH concept |')
    const report = threatModelReport(scenario, work, 5)
    expect(report.findings).toHaveLength(backlog.length)
    expect(report.findings[0].evidence).toContain('CEH concept')
    expect(reportQualityChecklist(report, []).filter((check) => check.required && !check.passed)).toEqual([])
  })

  it('normalizes stored work and drops unknown targets', () => {
    const normalized = normalizeThreatModelWork({
      [scenario.id]: { assetRatings: { a1: 'extreme', a2: 'high' }, threats: [{ id: 'ok', target: scenario.dataFlows[0].id, stride: 'S', threat: 't', mitigation: 'm', priority: 'P9', status: 'x' }, { id: 'bad', target: 'nowhere', stride: 'S' }] },
      'TM-99': {},
    }, THREAT_MODEL_SCENARIOS)
    expect(Object.keys(normalized)).toEqual([scenario.id])
    expect(normalized[scenario.id].assetRatings).toEqual({ a2: 'high' })
    expect(normalized[scenario.id].threats).toEqual([{ id: 'ok', target: scenario.dataFlows[0].id, stride: 'S', threat: 't', mitigation: 'm', priority: 'P2', status: 'todo', cehConcept: undefined }])
  })
})
