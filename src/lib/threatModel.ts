import type { StrideKey, ThreatModelScenario, ThreatPriority } from '../data/tracks/types'
import type { LearnerThreat, Report, Severity, ThreatModelWork } from '../types'
import { uid } from './id'

// ============================================================
// CEH+ Threat Modeling and Remediation track (P5-006): organize assets,
// trust boundaries, threats, and mitigations, then turn them into a
// remediation backlog that can feed the Report Builder.
// ============================================================

export const STRIDE: Record<StrideKey, string> = {
  S: 'Spoofing',
  T: 'Tampering',
  R: 'Repudiation',
  I: 'Information disclosure',
  D: 'Denial of service',
  E: 'Elevation of privilege',
}
export const STRIDE_KEYS = Object.keys(STRIDE) as StrideKey[]
export const PRIORITIES: ThreatPriority[] = ['P1', 'P2', 'P3']
export const BACKLOG_STATUSES: LearnerThreat['status'][] = ['todo', 'in-progress', 'done']
const SENSITIVITIES = ['high', 'medium', 'low'] as const
const MIN_TEXT = 10

export function blankThreatModelWork(scenario: ThreatModelScenario, now = Date.now()): ThreatModelWork {
  return { scenarioId: scenario.id, assetRatings: {}, boundaryNotes: {}, threats: [], updatedAt: now }
}

export function blankLearnerThreat(scenario: ThreatModelScenario): LearnerThreat {
  return {
    id: uid('lt-'),
    target: scenario.dataFlows[0]?.id ?? scenario.components[0].id,
    stride: 'S',
    threat: '',
    mitigation: '',
    priority: 'P2',
    status: 'todo',
  }
}

export function targetLabel(scenario: ThreatModelScenario, target: string): string {
  const component = scenario.components.find((item) => item.id === target)
  if (component) return component.name
  const flow = scenario.dataFlows.find((item) => item.id === target)
  if (!flow) return target
  const from = scenario.components.find((item) => item.id === flow.from)?.name ?? flow.from
  const to = scenario.components.find((item) => item.id === flow.to)?.name ?? flow.to
  return `${from} → ${to} (${flow.data})`
}

/** CEH concept from the model threat with the same STRIDE category and target, if any. */
export function suggestedCehConcept(scenario: ThreatModelScenario, threat: Pick<LearnerThreat, 'stride' | 'target'>): string | null {
  return scenario.modelThreats.find((item) => item.stride === threat.stride && item.target === threat.target)?.cehConcept
    ?? scenario.modelThreats.find((item) => item.stride === threat.stride)?.cehConcept
    ?? null
}

export interface ThreatModelReview {
  assetsRated: number
  assetAccuracyPct: number
  boundariesNoted: number
  strideCovered: StrideKey[]
  strideMissing: StrideKey[]
  incompleteThreats: string[]
  complete: boolean
  blockers: string[]
}

export function reviewThreatModel(scenario: ThreatModelScenario, work: ThreatModelWork): ThreatModelReview {
  const rated = scenario.assets.filter((asset) => work.assetRatings[asset.id])
  const correct = rated.filter((asset) => work.assetRatings[asset.id] === asset.sensitivity)
  const noted = scenario.boundaries.filter((boundary) => (work.boundaryNotes[boundary.id] ?? '').trim().length >= MIN_TEXT)
  const validThreats = work.threats.filter((threat) => threat.threat.trim().length >= MIN_TEXT && threat.mitigation.trim().length >= MIN_TEXT)
  const covered = STRIDE_KEYS.filter((key) => validThreats.some((threat) => threat.stride === key))
  const strideMissing = scenario.requiredStride.filter((key) => !covered.includes(key))
  const incompleteThreats = work.threats.filter((threat) => !validThreats.includes(threat)).map((threat) => threat.id)
  const blockers: string[] = []
  if (rated.length < scenario.assets.length) blockers.push(`Rate every asset (${rated.length}/${scenario.assets.length}).`)
  if (noted.length < scenario.boundaries.length) blockers.push(`Describe what each trust boundary must enforce (${noted.length}/${scenario.boundaries.length}).`)
  if (strideMissing.length > 0) blockers.push(`Cover the required STRIDE categories: ${strideMissing.map((key) => STRIDE[key]).join(', ')}.`)
  if (incompleteThreats.length > 0) blockers.push(`Complete the threat and mitigation text for ${incompleteThreats.length} threat(s).`)
  return {
    assetsRated: rated.length,
    assetAccuracyPct: rated.length > 0 ? Math.round((correct.length / rated.length) * 100) : 0,
    boundariesNoted: noted.length,
    strideCovered: covered,
    strideMissing,
    incompleteThreats,
    complete: blockers.length === 0,
    blockers,
  }
}

const PRIORITY_ORDER: ThreatPriority[] = ['P1', 'P2', 'P3']
const STATUS_ORDER: LearnerThreat['status'][] = ['in-progress', 'todo', 'done']

/** Remediation backlog: learner threats with mitigations, ordered by priority then status. */
export function remediationBacklog(work: ThreatModelWork): LearnerThreat[] {
  return work.threats
    .filter((threat) => threat.mitigation.trim().length >= MIN_TEXT)
    .sort((a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
      || STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
}

const PRIORITY_SEVERITY: Record<ThreatPriority, Severity> = { P1: 'high', P2: 'medium', P3: 'low' }

export function backlogToMarkdown(scenario: ThreatModelScenario, work: ThreatModelWork): string {
  const backlog = remediationBacklog(work)
  return [
    `# Remediation Backlog — ${scenario.title}`,
    '',
    '_Synthetic threat model; fictional architecture._',
    '',
    '| # | Priority | Status | STRIDE | Target | Mitigation | CEH concept |',
    '|---|---|---|---|---|---|---|',
    ...backlog.map((threat, index) => `| ${index + 1} | ${threat.priority} | ${threat.status} | ${STRIDE[threat.stride]} | ${targetLabel(scenario, threat.target).replace(/\|/g, '/')} | ${threat.mitigation.replace(/\|/g, '/').replace(/\s+/g, ' ')} | ${threat.cehConcept || suggestedCehConcept(scenario, threat) || '—'} |`),
  ].join('\n')
}

/** Report Builder hand-off: one finding per backlog item plus a remediation plan section. */
export function threatModelReport(scenario: ThreatModelScenario, work: ThreatModelWork, now = Date.now()): Report {
  const backlog = remediationBacklog(work)
  return {
    id: work.reportId ?? uid('r-'),
    title: `Threat model — ${scenario.title}`,
    scope: `Synthetic threat model of a fictional architecture: ${scenario.components.map((component) => component.name).join(', ')}.`,
    summary: `${backlog.length} design threat${backlog.length === 1 ? '' : 's'} identified across ${new Set(backlog.map((threat) => threat.stride)).size} STRIDE categories. ${scenario.system}`,
    methodology: `STRIDE per element over the data-flow diagram: assets rated by sensitivity, trust boundaries (${scenario.boundaries.map((boundary) => boundary.name).join(', ')}) reviewed, threats paired with design mitigations and CEH concepts.`,
    findings: backlog.map((threat) => ({
      id: uid('f-'),
      title: `${STRIDE[threat.stride]}: ${targetLabel(scenario, threat.target)}`,
      severity: PRIORITY_SEVERITY[threat.priority],
      impact: threat.threat,
      remediation: threat.mitigation,
      evidence: `Threat model element ${threat.target}; CEH concept: ${threat.cehConcept || suggestedCehConcept(scenario, threat) || 'n/a'}.`,
      evidenceIds: [],
      asset: targetLabel(scenario, threat.target),
    })),
    remediationPlan: backlog.map((threat, index) => `${index + 1}. [${threat.priority} · ${threat.status}] ${threat.mitigation}`).join('\n'),
    appendix: ['Data-flow diagram (synthetic):', ...scenario.diagram, '', 'Trust boundary notes:', ...scenario.boundaries.map((boundary) => `- ${boundary.name}: ${work.boundaryNotes[boundary.id] ?? ''}`)].join('\n'),
    createdAt: now,
    updatedAt: now,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeThreatModelWork(value: unknown, scenarios: ThreatModelScenario[]): Record<string, ThreatModelWork> {
  if (!isRecord(value)) return {}
  const out: Record<string, ThreatModelWork> = {}
  for (const scenario of scenarios) {
    const row = value[scenario.id]
    if (!isRecord(row)) continue
    const work = blankThreatModelWork(scenario, typeof row.updatedAt === 'number' && row.updatedAt > 0 ? row.updatedAt : Date.now())
    const targets = new Set([...scenario.components.map((item) => item.id), ...scenario.dataFlows.map((item) => item.id)])
    if (isRecord(row.assetRatings)) {
      for (const asset of scenario.assets) {
        const rating = row.assetRatings[asset.id]
        if (SENSITIVITIES.includes(rating as never)) work.assetRatings[asset.id] = rating as (typeof SENSITIVITIES)[number]
      }
    }
    if (isRecord(row.boundaryNotes)) {
      for (const boundary of scenario.boundaries) {
        const note = row.boundaryNotes[boundary.id]
        if (typeof note === 'string') work.boundaryNotes[boundary.id] = note.slice(0, 1000)
      }
    }
    if (Array.isArray(row.threats)) {
      work.threats = row.threats.flatMap((item) => {
        if (!isRecord(item) || typeof item.id !== 'string' || typeof item.target !== 'string' || !targets.has(item.target)) return []
        if (!STRIDE_KEYS.includes(item.stride as StrideKey)) return []
        return [{
          id: item.id,
          target: item.target,
          stride: item.stride as StrideKey,
          threat: typeof item.threat === 'string' ? item.threat.slice(0, 2000) : '',
          mitigation: typeof item.mitigation === 'string' ? item.mitigation.slice(0, 2000) : '',
          priority: PRIORITIES.includes(item.priority as ThreatPriority) ? (item.priority as ThreatPriority) : 'P2',
          status: BACKLOG_STATUSES.includes(item.status as LearnerThreat['status']) ? (item.status as LearnerThreat['status']) : 'todo',
          cehConcept: typeof item.cehConcept === 'string' && item.cehConcept.trim() ? item.cehConcept.slice(0, 200) : undefined,
        }]
      }).slice(0, 60)
    }
    if (typeof row.reportId === 'string' && row.reportId) work.reportId = row.reportId
    out[scenario.id] = work
  }
  return out
}
