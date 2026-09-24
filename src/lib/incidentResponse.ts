import type { IncidentScenario, TimelineConfidence } from '../data/tracks/types'
import type { TrackChallenge } from '../data/tracks/types'
import type { IncidentReportSections, IncidentTimelineEvent, IncidentWorkspace, TrackSubmission } from '../types'
import { uid } from './id'
import { lineTimestamp } from './trackChallenges'

// ============================================================
// CEH+ Incident Response Timeline / Report track (P5-005).
// Timeline events carry time, source, observation, confidence, and related
// evidence; the IR report covers summary, impact, containment, eradication,
// recovery, and lessons learned.
// ============================================================

export const CONFIDENCES: TimelineConfidence[] = ['high', 'medium', 'low']

export const IR_SECTIONS: Array<{ key: keyof IncidentReportSections; label: string; prompt: string }> = [
  { key: 'summary', label: 'Incident summary', prompt: 'What happened, when, and how it was detected.' },
  { key: 'impact', label: 'Impact', prompt: 'Affected accounts, data, systems, and business effect.' },
  { key: 'containment', label: 'Containment', prompt: 'Actions that stopped the incident from spreading.' },
  { key: 'eradication', label: 'Eradication', prompt: 'How the attacker foothold and root cause were removed.' },
  { key: 'recovery', label: 'Recovery', prompt: 'How service and data were restored and verified.' },
  { key: 'lessonsLearned', label: 'Lessons learned', prompt: 'What changes prevent recurrence, with owners.' },
]

export const MIN_TIMELINE_EVENTS = 5
const SECTION_MIN_LENGTH = 40

export function blankIncidentWorkspace(incident: IncidentScenario, now = Date.now()): IncidentWorkspace {
  return {
    incidentId: incident.id,
    events: [],
    report: { summary: '', impact: '', containment: '', eradication: '', recovery: '', lessonsLearned: '' },
    updatedAt: now,
  }
}

export function sortEvents(events: IncidentTimelineEvent[]): IncidentTimelineEvent[] {
  return [...events].sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id))
}

/** Creates a timeline event from one artifact line; the time comes from the line when present. */
export function eventFromArtifactLine(incident: IncidentScenario, artifactId: string, line: number): IncidentTimelineEvent | null {
  const artifact = incident.artifacts.find((item) => item.id === artifactId)
  const text = artifact?.lines[line - 1]
  if (!artifact || text === undefined) return null
  return {
    id: uid('ie-'),
    time: lineTimestamp(text) ?? '',
    source: artifact.label,
    observation: '',
    confidence: 'medium',
    evidence: `${artifact.label} L${line}`,
  }
}

/**
 * Imports the learner's latest SOC-track timeline for each related challenge. Events already present
 * (same time and evidence) are skipped so imports are idempotent.
 */
export function importSocTimelines(
  workspace: IncidentWorkspace,
  incident: IncidentScenario,
  challenges: TrackChallenge[],
  submissions: TrackSubmission[],
): { workspace: IncidentWorkspace; added: number } {
  const events = [...workspace.events]
  let added = 0
  for (const challengeId of incident.relatedSocChallenges) {
    const challenge = challenges.find((item) => item.id === challengeId)
    const latest = [...submissions].reverse().find((item) => item.challengeId === challengeId && item.timeline?.length)
    if (!challenge || !latest?.timeline) continue
    for (const event of latest.timeline) {
      const evidence = `${challenge.id} ${challenge.artifact.label} L${event.line}`
      if (events.some((existing) => existing.time === event.time && existing.evidence === evidence)) continue
      events.push({
        id: uid('ie-'),
        time: event.time,
        source: `SOC track ${challenge.id}`,
        observation: event.observation,
        confidence: 'medium',
        evidence,
      })
      added++
    }
  }
  return { workspace: { ...workspace, events: sortEvents(events) }, added }
}

export function eventsMissingEvidence(events: IncidentTimelineEvent[]): IncidentTimelineEvent[] {
  return events.filter((event) => !event.evidence.trim())
}

export interface IrQualityCheck {
  id: string
  label: string
  passed: boolean
  detail: string
}

export function irQualityChecklist(workspace: IncidentWorkspace): IrQualityCheck[] {
  const events = workspace.events
  const missingEvidence = eventsMissingEvidence(events)
  const undescribed = events.filter((event) => event.observation.trim().length < 5)
  const untimed = events.filter((event) => !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(event.time))
  const sources = new Set(events.map((event) => event.source))
  const emptySections = IR_SECTIONS.filter((section) => workspace.report[section.key].trim().length < SECTION_MIN_LENGTH)
  return [
    {
      id: 'timeline-size',
      label: `Timeline has at least ${MIN_TIMELINE_EVENTS} events`,
      passed: events.length >= MIN_TIMELINE_EVENTS,
      detail: `${events.length} event${events.length === 1 ? '' : 's'} recorded.`,
    },
    {
      id: 'timeline-times',
      label: 'Every event has an ISO-8601 time',
      passed: events.length > 0 && untimed.length === 0,
      detail: untimed.length > 0 ? `${untimed.length} event(s) need a timestamp.` : 'All events are timestamped.',
    },
    {
      id: 'timeline-observations',
      label: 'Every event states what was observed',
      passed: events.length > 0 && undescribed.length === 0,
      detail: undescribed.length > 0 ? `${undescribed.length} event(s) need an observation.` : 'All events are described.',
    },
    {
      id: 'evidence',
      label: 'Every event cites related evidence',
      passed: events.length > 0 && missingEvidence.length === 0,
      detail: missingEvidence.length > 0 ? `${missingEvidence.length} event(s) have no evidence reference.` : 'All events cite evidence.',
    },
    {
      id: 'sources',
      label: 'Timeline correlates at least two sources',
      passed: sources.size >= 2,
      detail: `${sources.size} source${sources.size === 1 ? '' : 's'} used.`,
    },
    {
      id: 'confidence',
      label: 'At least one high-confidence anchor event',
      passed: events.some((event) => event.confidence === 'high'),
      detail: 'Mark events directly proven by an artifact as high confidence.',
    },
    {
      id: 'sections',
      label: 'Summary, impact, containment, eradication, recovery, and lessons learned are written',
      passed: emptySections.length === 0,
      detail: emptySections.length > 0 ? `Write: ${emptySections.map((section) => section.label).join(', ')}.` : 'All sections written.',
    },
  ]
}

/** Compares learner events with the model timeline by timestamp. */
export function modelTimelineCoverage(incident: IncidentScenario, workspace: IncidentWorkspace) {
  const times = new Set(workspace.events.map((event) => event.time))
  const matched = incident.modelTimeline.filter((entry) => times.has(entry.time))
  return { matched: matched.length, total: incident.modelTimeline.length, missing: incident.modelTimeline.filter((entry) => !times.has(entry.time)) }
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim() || '—'
}

export function incidentReportToMarkdown(incident: IncidentScenario, workspace: IncidentWorkspace, now = Date.now()): string {
  const checks = irQualityChecklist(workspace)
  const missing = eventsMissingEvidence(workspace.events)
  const section = (label: string, value: string) => [`## ${label}`, '', value.trim() || '_Not written yet._', '']
  return [
    `# Incident Report — ${incident.title}`,
    '',
    `**Organization:** ${incident.organization}`,
    '**Scope:** Synthetic training incident; all accounts, hosts, and data are fictional.',
    '',
    ...section('Incident Summary', workspace.report.summary),
    ...section('Impact', workspace.report.impact),
    '## Timeline',
    '',
    '| Time (UTC) | Source | Observation | Confidence | Evidence |',
    '|---|---|---|---|---|',
    ...sortEvents(workspace.events).map((event) => `| ${cell(event.time)} | ${cell(event.source)} | ${cell(event.observation)} | ${event.confidence} | ${cell(event.evidence)} |`),
    '',
    ...(missing.length > 0 ? [`> **Missing evidence:** ${missing.length} timeline event(s) cite no evidence.`, ''] : []),
    ...section('Containment', workspace.report.containment),
    ...section('Eradication', workspace.report.eradication),
    ...section('Recovery', workspace.report.recovery),
    ...section('Lessons Learned', workspace.report.lessonsLearned),
    '## Report Quality Checklist',
    '',
    ...checks.map((check) => `- [${check.passed ? 'x' : ' '}] ${check.label}`),
    '',
    '---',
    `_Generated by NeonSec Academy — synthetic incident response exercise, ${new Date(now).toISOString().slice(0, 10)}._`,
  ].join('\n')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

export function normalizeIncidentWorkspaces(value: unknown, incidents: IncidentScenario[]): Record<string, IncidentWorkspace> {
  if (!isRecord(value)) return {}
  const out: Record<string, IncidentWorkspace> = {}
  for (const incident of incidents) {
    const row = value[incident.id]
    if (!isRecord(row)) continue
    const workspace = blankIncidentWorkspace(incident, typeof row.updatedAt === 'number' && row.updatedAt > 0 ? row.updatedAt : Date.now())
    if (Array.isArray(row.events)) {
      workspace.events = sortEvents(row.events.flatMap((event) => {
        if (!isRecord(event) || typeof event.id !== 'string') return []
        const confidence = CONFIDENCES.includes(event.confidence as TimelineConfidence) ? (event.confidence as TimelineConfidence) : 'medium'
        return [{
          id: event.id,
          time: text(event.time, 40),
          source: text(event.source, 200),
          observation: text(event.observation, 2000),
          confidence,
          evidence: text(event.evidence, 400),
        }]
      }).slice(0, 200))
    }
    if (isRecord(row.report)) {
      for (const section of IR_SECTIONS) workspace.report[section.key] = text(row.report[section.key], 6000)
    }
    out[incident.id] = workspace
  }
  return out
}
