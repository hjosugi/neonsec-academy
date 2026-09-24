import type { AnalysisChallengeType, Lab } from '../data/labs'

export interface AnalysisTypeMeta {
  label: string
  artifact: string
  focus: string
}

/** Dataset-analysis challenge families required by P4-004. */
export const ANALYSIS_TYPES: Record<AnalysisChallengeType, AnalysisTypeMeta> = {
  pcap: {
    label: 'PCAP / packet summary',
    artifact: 'Prepared packet-summary rows',
    focus: 'Protocols, cleartext exposure, and session handling on the wire.',
  },
  'web-log': {
    label: 'Web access log',
    artifact: 'Synthetic HTTP access log',
    focus: 'Request patterns, status-code ratios, and the request that caused impact.',
  },
  'auth-log': {
    label: 'Authentication log',
    artifact: 'Synthetic sign-in events',
    focus: 'Failure patterns, pivot successes, and MFA gaps.',
  },
  'cloud-config': {
    label: 'Cloud configuration',
    artifact: 'Synthetic policy and resource settings',
    focus: 'Least privilege, public exposure, encryption, and logging.',
  },
  'firewall-rule': {
    label: 'Firewall rule set',
    artifact: 'Ordered synthetic rule export',
    focus: 'Rule order, shadowing, over-broad allows, and governance.',
  },
  'email-headers': {
    label: 'Email headers',
    artifact: 'Synthetic message headers',
    focus: 'Sender authentication results and lookalike domains.',
  },
}

export const ANALYSIS_TYPE_KEYS = Object.keys(ANALYSIS_TYPES) as AnalysisChallengeType[]

export function isAnalysisType(value: unknown): value is AnalysisChallengeType {
  return typeof value === 'string' && ANALYSIS_TYPE_KEYS.includes(value as AnalysisChallengeType)
}

export function analysisLabs(labs: Lab[]): Lab[] {
  return labs.filter((lab) => lab.analysis !== undefined)
}

/** Number of shipped analysis challenges per type, including zero-count types. */
export function analysisCoverage(labs: Lab[]): Record<AnalysisChallengeType, number> {
  const coverage = Object.fromEntries(ANALYSIS_TYPE_KEYS.map((key) => [key, 0])) as Record<AnalysisChallengeType, number>
  for (const lab of analysisLabs(labs)) coverage[lab.analysis!.type]++
  return coverage
}
