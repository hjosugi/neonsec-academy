import type {
  EngagementFindingStatus,
  EngagementScenario,
  EngagementStepKey,
} from '../data/tracks/types'
import type { EngagementProgress, Report, Severity } from '../types'
import { uid } from './id'

// ============================================================
// CEH+ Pentest Engagement Workflow (P5-001): step completion, scoring,
// and the final Markdown report. Learners only reason over prepared,
// synthetic engagement material.
// ============================================================

export const ENGAGEMENT_STEP_ORDER: EngagementStepKey[] = ['scope', 'roe', 'inventory', 'triage', 'report']
export const ENGAGEMENT_STATUSES: EngagementFindingStatus[] = ['confirmed', 'false-positive', 'out-of-scope']
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']

export function blankEngagementProgress(scenario: EngagementScenario, now = Date.now()): EngagementProgress {
  return {
    scenarioId: scenario.id,
    checklist: Object.fromEntries(scenario.steps.map((step) => [step.key, step.checklist.map(() => false)])) as EngagementProgress['checklist'],
    quizAnswers: {},
    inventory: {},
    triage: {},
    roeAcknowledged: false,
    updatedAt: now,
  }
}

export interface StepStatus {
  key: EngagementStepKey
  complete: boolean
  /** 0-100 accuracy for graded steps; null when the step is checklist-only. */
  scorePct: number | null
  blockers: string[]
}

function checklistDone(scenario: EngagementScenario, progress: EngagementProgress, key: EngagementStepKey): boolean {
  const step = scenario.steps.find((item) => item.key === key)
  const marks = progress.checklist[key] ?? []
  return !!step && step.checklist.every((_, index) => marks[index] === true)
}

function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

export function quizScore(scenario: EngagementScenario, progress: EngagementProgress) {
  const answered = scenario.scopeQuiz.filter((item) => progress.quizAnswers[item.id] !== undefined)
  const correct = scenario.scopeQuiz.filter((item) => progress.quizAnswers[item.id] === item.answer).length
  return { answered: answered.length, correct, total: scenario.scopeQuiz.length }
}

export function inventoryReview(scenario: EngagementScenario, progress: EngagementProgress) {
  const classified = scenario.assets.filter((asset) => progress.inventory[asset.id] !== undefined)
  const wrong = classified.filter((asset) => progress.inventory[asset.id] !== asset.inScope)
  return { classified: classified.length, wrong: wrong.map((asset) => asset.id), total: scenario.assets.length }
}

export function triageReview(scenario: EngagementScenario, progress: EngagementProgress) {
  const decided = scenario.findings.filter((finding) => progress.triage[finding.id]?.status)
  const wrongStatus = decided.filter((finding) => progress.triage[finding.id].status !== finding.expectedStatus)
  const severityGaps = decided.filter((finding) => {
    const chosen = progress.triage[finding.id].severity
    return Math.abs(SEVERITIES.indexOf(chosen) - SEVERITIES.indexOf(finding.expectedSeverity)) >= 2
  })
  return {
    decided: decided.length,
    wrongStatus: wrongStatus.map((finding) => finding.id),
    severityGaps: severityGaps.map((finding) => finding.id),
    total: scenario.findings.length,
  }
}

export function engagementStepStatus(
  scenario: EngagementScenario,
  progress: EngagementProgress,
  key: EngagementStepKey,
): StepStatus {
  const blockers: string[] = []
  let scorePct: number | null = null
  if (!checklistDone(scenario, progress, key)) blockers.push('Tick every checklist item for this step.')

  if (key === 'scope') {
    const quiz = quizScore(scenario, progress)
    scorePct = pct(quiz.correct, quiz.total)
    if (quiz.correct < quiz.total) blockers.push(`Answer every scope-violation question correctly (${quiz.correct}/${quiz.total}).`)
  } else if (key === 'roe') {
    if (!progress.roeAcknowledged) blockers.push('Acknowledge the rules of engagement.')
  } else if (key === 'inventory') {
    const inventory = inventoryReview(scenario, progress)
    scorePct = pct(inventory.classified - inventory.wrong.length, inventory.total)
    if (inventory.classified < inventory.total) blockers.push(`Classify every asset (${inventory.classified}/${inventory.total}).`)
    if (inventory.wrong.length > 0) blockers.push(`Fix scope decisions for ${inventory.wrong.length} asset${inventory.wrong.length === 1 ? '' : 's'}.`)
  } else if (key === 'triage') {
    const triage = triageReview(scenario, progress)
    scorePct = pct(triage.decided - triage.wrongStatus.length, triage.total)
    if (triage.decided < triage.total) blockers.push(`Triage every finding (${triage.decided}/${triage.total}).`)
    if (triage.wrongStatus.length > 0) blockers.push(`Revisit the status of ${triage.wrongStatus.length} finding${triage.wrongStatus.length === 1 ? '' : 's'}.`)
  } else if (key === 'report') {
    if (!progress.reportId) blockers.push('Generate the engagement report.')
  }

  return { key, complete: blockers.length === 0, scorePct, blockers }
}

export function engagementStatus(scenario: EngagementScenario, progress: EngagementProgress) {
  const steps = ENGAGEMENT_STEP_ORDER.map((key) => engagementStepStatus(scenario, progress, key))
  return {
    steps,
    completedSteps: steps.filter((step) => step.complete).length,
    complete: steps.every((step) => step.complete),
  }
}

/** Builds the final report from the learner's triage decisions (confirmed findings only). */
export function engagementReport(scenario: EngagementScenario, progress: EngagementProgress, now = Date.now()): Report {
  const assetsById = new Map(scenario.assets.map((asset) => [asset.id, asset]))
  const confirmed = scenario.findings.filter((finding) => progress.triage[finding.id]?.status === 'confirmed')
  const excluded = scenario.findings.filter((finding) => progress.triage[finding.id] && progress.triage[finding.id].status !== 'confirmed')
  const inScope = scenario.assets.filter((asset) => asset.inScope)
  const outOfScope = scenario.assets.filter((asset) => !asset.inScope)
  const findings = confirmed
    .map((finding) => ({
      id: uid('f-'),
      title: finding.title,
      severity: progress.triage[finding.id].severity,
      impact: finding.impact,
      remediation: finding.remediation,
      evidence: `${finding.source}: ${finding.evidence}`,
      evidenceIds: [],
      asset: assetsById.get(finding.assetId)?.address,
      status: 'confirmed' as const,
    }))
    .sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity))

  return {
    id: progress.reportId ?? uid('r-'),
    title: `Engagement report — ${scenario.title}`,
    scope: `Synthetic training engagement for ${scenario.client}. In scope: ${inScope.map((asset) => asset.address).join(', ')}. Out of scope: ${outOfScope.map((asset) => asset.address).join(', ')}.`,
    summary: `${scenario.summary} ${findings.length} confirmed finding${findings.length === 1 ? '' : 's'} are reported below; ${excluded.length} item${excluded.length === 1 ? ' was' : 's were'} closed as false positive or out of scope.`,
    methodology: [
      'Work followed the signed statement of work and rules of engagement: scope review, rules-of-engagement acknowledgement,',
      'asset inventory against the written scope, triage of prepared scanner exports and manual-test notes, and report delivery.',
      'All material is synthetic; no live system was contacted.',
    ].join(' '),
    findings,
    remediationPlan: findings
      .map((finding, index) => `${index + 1}. [${finding.severity === 'critical' || finding.severity === 'high' ? 'Immediate' : finding.severity === 'medium' ? 'Short term' : 'Planned'}] ${finding.title} — ${finding.remediation}`)
      .join('\n'),
    appendix: [
      'Rules of engagement:',
      ...scenario.rulesOfEngagement.map((line) => `- ${line}`),
      '',
      'Closed items (not reported as findings):',
      ...excluded.map((finding) => `- ${finding.title}: ${progress.triage[finding.id].status}`),
    ].join('\n'),
    createdAt: now,
    updatedAt: now,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Normalizes persisted/imported progress against the static scenarios. */
export function normalizeEngagementProgress(value: unknown, scenarios: EngagementScenario[]): Record<string, EngagementProgress> {
  if (!isRecord(value)) return {}
  const out: Record<string, EngagementProgress> = {}
  for (const scenario of scenarios) {
    const row = value[scenario.id]
    if (!isRecord(row)) continue
    const base = blankEngagementProgress(scenario, typeof row.updatedAt === 'number' ? row.updatedAt : Date.now())
    const checklist = isRecord(row.checklist) ? row.checklist : {}
    for (const step of scenario.steps) {
      const marks = checklist[step.key]
      if (Array.isArray(marks)) base.checklist[step.key] = step.checklist.map((_, index) => marks[index] === true)
    }
    if (isRecord(row.quizAnswers)) {
      for (const item of scenario.scopeQuiz) {
        const answer = row.quizAnswers[item.id]
        if (typeof answer === 'string' && item.options.includes(answer)) base.quizAnswers[item.id] = answer
      }
    }
    if (isRecord(row.inventory)) {
      for (const asset of scenario.assets) {
        if (typeof row.inventory[asset.id] === 'boolean') base.inventory[asset.id] = row.inventory[asset.id] as boolean
      }
    }
    if (isRecord(row.triage)) {
      for (const finding of scenario.findings) {
        const decision = row.triage[finding.id]
        if (
          isRecord(decision)
          && ENGAGEMENT_STATUSES.includes(decision.status as EngagementFindingStatus)
          && SEVERITIES.includes(decision.severity as Severity)
        ) {
          base.triage[finding.id] = { status: decision.status as EngagementFindingStatus, severity: decision.severity as Severity }
        }
      }
    }
    base.roeAcknowledged = row.roeAcknowledged === true
    if (typeof row.reportId === 'string' && row.reportId) base.reportId = row.reportId
    if (typeof row.completedAt === 'number' && row.completedAt > 0) base.completedAt = row.completedAt
    out[scenario.id] = base
  }
  return out
}
