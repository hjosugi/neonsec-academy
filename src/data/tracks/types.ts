// ============================================================
// CEH+ practical track content schema.
// Every artifact is synthetic: fictional organizations, documentation or
// private IP ranges, safe training domains (.example / .internal / .test /
// .invalid / .localhost), and placeholder secrets such as `<redacted>`.
// See docs/SAFETY_BOUNDARIES.md and docs/PRACTICAL_TRACKS.md.
// ============================================================
import type { Difficulty, Severity, TrackKey } from '../../types'

/** Review-style challenges that share one engine: select lines, classify, write up. */
export type TrackChallengeKind = 'code-review' | 'config-review' | 'log-investigation'

export interface TrackArtifact {
  /** Display label, e.g. `invoices.controller.ts (toy)` or `dns.log (synthetic)`. */
  label: string
  /** Syntax hint for the viewer: ts, js, py, java, go, json, yaml, hcl, log, text. */
  language: string
  /** One entry per artifact line. Line references elsewhere are 1-based. */
  lines: string[]
}

export interface TrackWriteupField {
  /** Stable key such as `impact`, `fix`, `indicator`, `affected-asset`, `next-action`. */
  key: string
  label: string
  prompt: string
  /** Model answer shown after submission for self-assessment. */
  model: string
}

export interface TrackTimelineEntry {
  /** ISO-8601 time copied from the artifact line. */
  time: string
  /** 1-based artifact line that supports the event. */
  line: number
  observation: string
}

export interface TrackChallenge {
  /** Stable id, e.g. `APPSEC-01`, `CLOUD-03`, `SOC-10`. */
  id: string
  track: Extract<TrackKey, 'appsec' | 'cloud' | 'soc'>
  kind: TrackChallengeKind
  title: string
  difficulty: Difficulty
  /** CEH module mapping (1-20) so practical work links back to exam study. */
  cehModules: number[]
  /** kebab-case skill tags used for weakness stats, e.g. `authz`, `soc-triage`. */
  skills: string[]
  /** Track-specific category, e.g. `authz`, `public-exposure`, `dns-log`. */
  category: string
  /** Fictional context in one to three sentences. */
  scenario: string
  artifact: TrackArtifact
  /** Instruction for the line-selection step. */
  linePrompt: string
  /** 1-based vulnerable, risky, or indicator lines. */
  answerLines: number[]
  classification: {
    prompt: string
    options: string[]
    answer: string
  }
  /** Two to four required written deliverables. */
  writeups: TrackWriteupField[]
  /** Root cause / why the selected lines matter. */
  explanation: string
  remediation: string
  /** SOC: detection logic that would surface this activity. */
  detection?: string
  /** SOC: containment idea. */
  containment?: string
  /** Cloud: least-privilege explanation. */
  leastPrivilege?: string
  /** AppSec: safe replacement lines for the vulnerable snippet. */
  safeFix?: string[]
  /** AppSec: unit-test idea that proves the fix. */
  testIdea?: string
  /** SOC: model timeline for the timeline builder. */
  timeline?: TrackTimelineEntry[]
}

// ---- Threat modeling (P5-006) ----
export type StrideKey = 'S' | 'T' | 'R' | 'I' | 'D' | 'E'
export type ThreatPriority = 'P1' | 'P2' | 'P3'

export interface ThreatComponent {
  id: string
  name: string
  kind: 'actor' | 'process' | 'store' | 'external'
  description: string
}

export interface ThreatDataFlow {
  id: string
  from: string
  to: string
  data: string
  protocol: string
  /** Trust boundary id crossed by this flow, if any. */
  boundary?: string
}

export interface ThreatBoundary {
  id: string
  name: string
  description: string
}

export interface ThreatAsset {
  id: string
  name: string
  sensitivity: 'high' | 'medium' | 'low'
}

export interface ModelThreat {
  id: string
  stride: StrideKey
  /** Component or data-flow id the threat applies to. */
  target: string
  threat: string
  mitigation: string
  /** CEH concept this threat connects to, e.g. `Session hijacking (M11)`. */
  cehConcept: string
  priority: ThreatPriority
}

export interface ThreatModelScenario {
  /** Stable id, e.g. `TM-01`. */
  id: string
  title: string
  difficulty: Difficulty
  cehModules: number[]
  skills: string[]
  /** Fictional system description. */
  system: string
  /** ASCII data-flow diagram, one entry per line. */
  diagram: string[]
  components: ThreatComponent[]
  dataFlows: ThreatDataFlow[]
  boundaries: ThreatBoundary[]
  assets: ThreatAsset[]
  /** STRIDE categories a complete model must cover. */
  requiredStride: StrideKey[]
  modelThreats: ModelThreat[]
}

// ---- Pentest engagement workflow (P5-001) ----
export type EngagementAssetType = 'web' | 'api' | 'host' | 'cloud' | 'network' | 'saas' | 'people'
export type EngagementFindingStatus = 'confirmed' | 'false-positive' | 'out-of-scope'

export interface EngagementAsset {
  id: string
  name: string
  /** Safe training address only: documentation/private IP or safe training domain. */
  address: string
  type: EngagementAssetType
  owner: string
  inScope: boolean
  criticality: 'high' | 'medium' | 'low'
  /** Why the asset is (not) in scope, quoted from the SoW/RoE. */
  reason: string
}

export interface EngagementQuizItem {
  id: string
  prompt: string
  options: string[]
  answer: string
  explanation: string
}

export interface EngagementFinding {
  id: string
  title: string
  assetId: string
  /** Synthetic source, e.g. `scanner-export.csv row 14 (synthetic)`. */
  source: string
  evidence: string
  expectedStatus: EngagementFindingStatus
  expectedSeverity: Severity
  impact: string
  remediation: string
  rationale: string
}

export type EngagementStepKey = 'scope' | 'roe' | 'inventory' | 'triage' | 'report'

export interface EngagementStep {
  key: EngagementStepKey
  title: string
  goal: string
  checklist: string[]
  deliverable: string
}

export interface EngagementScenario {
  id: string
  title: string
  /** Fictional client, clearly labeled as fictional. */
  client: string
  summary: string
  statementOfWork: string[]
  rulesOfEngagement: string[]
  assets: EngagementAsset[]
  scopeQuiz: EngagementQuizItem[]
  findings: EngagementFinding[]
  steps: EngagementStep[]
}

// ---- Incident response (P5-005) ----
export type TimelineConfidence = 'high' | 'medium' | 'low'

export interface IncidentArtifact {
  id: string
  label: string
  kind: 'log' | 'alert' | 'ticket' | 'note'
  lines: string[]
}

export interface IncidentTimelineModel {
  time: string
  source: string
  observation: string
  confidence: TimelineConfidence
  artifactId: string
  line: number
}

export interface IncidentReportModel {
  summary: string
  impact: string
  containment: string
  eradication: string
  recovery: string
  lessonsLearned: string
}

export interface IncidentScenario {
  id: string
  title: string
  organization: string
  summary: string
  /** SOC track challenge ids whose timelines can be imported into this incident. */
  relatedSocChallenges: string[]
  artifacts: IncidentArtifact[]
  modelTimeline: IncidentTimelineModel[]
  modelReport: IncidentReportModel
}
