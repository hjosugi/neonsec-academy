// ============================================================
// Fixtures for the Lab Safety Audit publish gate (P4-010).
// SAFE_SAMPLE_LAB must pass; UNSAFE_SAMPLE_LAB deliberately contains
// detectable unsafe content so the gate can prove it rejects it. The unsafe
// sample is never listed in LABS and never rendered as a playable lab.
// ============================================================
import type { Lab } from './labs'

const baseRubric: Lab['rubric'] = {
  challengeType: 'audit-sample',
  passingScore: 80,
  hintPenalty: 2,
  scopeWarningPenalty: 5,
  components: [
    { key: 'flag', label: 'Flag / diagnosis', points: 20, objectiveIndexes: [0], description: 'Names the finding.' },
    { key: 'evidence', label: 'Evidence', points: 25, objectiveIndexes: [1], description: 'Cites the artifact.' },
    { key: 'explanation', label: 'Explanation', points: 20, objectiveIndexes: [1], description: 'Explains the finding.' },
    { key: 'remediation', label: 'Remediation', points: 25, objectiveIndexes: [2], description: 'Recommends the fix.' },
    { key: 'safety', label: 'Safety', points: 10, requiresSafetyAck: true, description: 'Scope acknowledged.' },
  ],
}

export const SAFE_SAMPLE_LAB: Lab = {
  id: 'audit-sample-safe',
  title: 'Audit Sample: Synthetic DNS Review',
  category: 'SOC',
  kind: 'dataset',
  glyph: '◇',
  color: '#48cae4',
  difficulty: 'easy',
  brief: 'Review a synthetic DNS log from a fictional workstation and decide whether the lookups look automated.',
  scope: {
    allowed: ['The provided synthetic DNS log', 'Local notes and the report builder'],
    forbidden: ['Any real resolver, domain, or host', 'Any external lookup', 'Generating traffic'],
  },
  evidenceTitle: 'dns.log (synthetic)',
  evidence: `2026-05-02T09:00:00Z 10.20.4.17 query A updates.neoncorp.example NOERROR
2026-05-02T09:05:00Z 10.20.4.17 query A cdn-7f.tracking-demo.invalid NOERROR
2026-05-02T09:10:00Z 10.20.4.17 query A cdn-7f.tracking-demo.invalid NOERROR`,
  flagChallenge: {
    prompt: 'Name the timing pattern shown by the repeated lookups and submit it as a flag.',
    assets: [{ id: 'dns-log', label: 'dns.log (synthetic)', kind: 'log', description: 'Prepared DNS queries from a fictional host.' }],
    expectedFlag: 'FLAG{FIXED_INTERVAL_BEACON}',
    hints: ['Compare the timestamps of the repeated domain.'],
    explanation: 'Lookups repeat every five minutes to the same fictional domain, a beacon-like fixed interval.',
    remediation: 'Isolate the fictional host for triage, block the domain at the resolver, and alert on fixed-interval lookups.',
    reportPrompt: 'Write a finding that cites the repeated lookups and recommends containment and detection.',
  },
  safetyAudit: { rulesetVersion: 1, status: 'pass', reviewedAt: '2026-09-24' },
  objectives: ['Name the timing pattern', 'Cite the repeated lookups', 'Recommend containment and detection'],
  rubric: baseRubric,
  guiding: [{ q: 'What repeats?', a: 'The same fictional domain every five minutes.' }],
  modelFindings: [
    { title: 'Beacon-like DNS lookups from a fictional workstation', severity: 'medium', impact: 'Possible automated check-ins.', remediation: 'Contain, block, and add interval-based detection.' },
  ],
}

export const UNSAFE_SAMPLE_LAB: Lab = {
  ...SAFE_SAMPLE_LAB,
  id: 'audit-sample-unsafe',
  title: 'Audit Sample: Unsafe Draft (must be rejected)',
  brief: 'Draft that violates the safety boundaries on purpose so the publish gate can prove it rejects it.',
  scope: {
    allowed: ['The production VPN portal at portal.unsafe-sample.com', 'Real employee accounts'],
    forbidden: ['Nothing'],
  },
  evidence: `2026-05-02T09:00:00Z 8.8.8.8 login user=admin password=Winter2026-Sample
2026-05-02T09:01:00Z portal.unsafe-sample.com GET /search?q=<script>`,
  objectives: ['Scan the VPN portal for open services', 'Run mimikatz on the jump host', 'Report what you collected'],
  safetyAudit: { rulesetVersion: 1, status: 'pass', reviewedAt: '2026-09-24' },
}
