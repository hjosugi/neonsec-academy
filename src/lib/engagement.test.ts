import { describe, expect, it } from 'vitest'
import { ENGAGEMENTS } from '../data/tracks/engagement'
import type { EngagementProgress } from '../types'
import { auditFields } from './labSafetyAudit'
import {
  ENGAGEMENT_STEP_ORDER,
  blankEngagementProgress,
  engagementReport,
  engagementStatus,
  normalizeEngagementProgress,
} from './engagement'
import { reportQualityChecklist } from './reportQuality'
import { reportToMarkdown } from './reportMarkdown'

const scenario = ENGAGEMENTS[0]

function completedProgress(): EngagementProgress {
  const progress = blankEngagementProgress(scenario, 1_000)
  for (const step of scenario.steps) progress.checklist[step.key] = step.checklist.map(() => true)
  for (const item of scenario.scopeQuiz) progress.quizAnswers[item.id] = item.answer
  for (const asset of scenario.assets) progress.inventory[asset.id] = asset.inScope
  for (const finding of scenario.findings) progress.triage[finding.id] = { status: finding.expectedStatus, severity: finding.expectedSeverity }
  progress.roeAcknowledged = true
  return progress
}

describe('engagement scenario content', () => {
  it('is internally consistent and walks scope, RoE, inventory, triage, report', () => {
    expect(scenario.steps.map((step) => step.key)).toEqual(ENGAGEMENT_STEP_ORDER)
    for (const step of scenario.steps) {
      expect(step.checklist.length).toBeGreaterThanOrEqual(4)
      expect(step.deliverable.trim()).not.toBe('')
    }
    expect(scenario.scopeQuiz.length).toBeGreaterThanOrEqual(5)
    for (const item of scenario.scopeQuiz) expect(item.options).toContain(item.answer)
    const assetIds = new Set(scenario.assets.map((asset) => asset.id))
    expect(assetIds.size).toBe(scenario.assets.length)
    for (const finding of scenario.findings) expect(assetIds.has(finding.assetId)).toBe(true)
    expect(scenario.assets.some((asset) => asset.inScope)).toBe(true)
    expect(scenario.assets.some((asset) => !asset.inScope)).toBe(true)
  })

  it('passes the content safety audit', () => {
    const text = [
      scenario.summary,
      ...scenario.statementOfWork,
      ...scenario.rulesOfEngagement,
      ...scenario.assets.map((asset) => `${asset.name} ${asset.address} ${asset.owner} ${asset.reason}`),
      ...scenario.scopeQuiz.map((item) => `${item.prompt}\n${item.options.join('\n')}\n${item.explanation}`),
      ...scenario.findings.map((finding) => `${finding.title}\n${finding.source}\n${finding.evidence}\n${finding.impact}\n${finding.remediation}\n${finding.rationale}`),
    ].join('\n')
    expect(auditFields([{ field: 'engagement', text, mode: 'prose' }]).filter((finding) => finding.severity === 'blocker')).toEqual([])
  })
})

describe('engagement workflow', () => {
  it('starts incomplete and completes end to end once every step is done', () => {
    const blank = engagementStatus(scenario, blankEngagementProgress(scenario))
    expect(blank.complete).toBe(false)
    expect(blank.completedSteps).toBe(0)

    const progress = completedProgress()
    const beforeReport = engagementStatus(scenario, progress)
    expect(beforeReport.steps.filter((step) => !step.complete).map((step) => step.key)).toEqual(['report'])
    expect(engagementStatus(scenario, { ...progress, reportId: 'r-1' }).complete).toBe(true)
  })

  it('blocks steps on wrong scope answers, inventory mistakes, and wrong triage status', () => {
    const progress = completedProgress()
    const firstOut = scenario.assets.find((asset) => !asset.inScope)!
    const falsePositive = scenario.findings.find((finding) => finding.expectedStatus === 'false-positive')!
    const wrong: EngagementProgress = {
      ...progress,
      quizAnswers: { ...progress.quizAnswers, [scenario.scopeQuiz[0].id]: scenario.scopeQuiz[0].options.find((option) => option !== scenario.scopeQuiz[0].answer)! },
      inventory: { ...progress.inventory, [firstOut.id]: true },
      triage: { ...progress.triage, [falsePositive.id]: { status: 'confirmed', severity: 'high' } },
      roeAcknowledged: false,
    }
    const status = engagementStatus(scenario, wrong)
    expect(status.steps.filter((step) => !step.complete).map((step) => step.key)).toEqual(['scope', 'roe', 'inventory', 'triage', 'report'])
  })

  it('builds an exportable report from confirmed findings only', () => {
    const progress = completedProgress()
    const report = engagementReport(scenario, progress, 5_000)
    const confirmed = scenario.findings.filter((finding) => finding.expectedStatus === 'confirmed')
    expect(report.findings.map((finding) => finding.title).sort()).toEqual(confirmed.map((finding) => finding.title).sort())
    expect(report.scope).toContain('Synthetic training engagement')
    expect(report.appendix).toContain('Closed items')
    const failing = reportQualityChecklist(report, []).filter((check) => !check.passed && check.required).map((check) => check.id)
    expect(failing).toEqual([])
    expect(reportToMarkdown(report, [])).toContain('## Remediation Plan')
  })

  it('normalizes imported progress against the scenario', () => {
    const progress = completedProgress()
    const normalized = normalizeEngagementProgress({
      [scenario.id]: { ...progress, quizAnswers: { ...progress.quizAnswers, 'SQ-X': 'bogus', [scenario.scopeQuiz[0].id]: 'not an option' }, triage: { [scenario.findings[0].id]: { status: 'maybe', severity: 'high' } } },
      'ENG-UNKNOWN': progress,
    }, ENGAGEMENTS)
    expect(Object.keys(normalized)).toEqual([scenario.id])
    expect(normalized[scenario.id].quizAnswers[scenario.scopeQuiz[0].id]).toBeUndefined()
    expect(normalized[scenario.id].triage).toEqual({})
    expect(normalized[scenario.id].roeAcknowledged).toBe(true)
  })
})
