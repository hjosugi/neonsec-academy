import { describe, expect, it } from 'vitest'
import { INCIDENTS } from '../data/tracks/incidents'
import { TRACK_CHALLENGES, trackChallengeById } from '../data/tracks'
import type { IncidentWorkspace, TrackSubmission } from '../types'
import { auditFields } from './labSafetyAudit'
import {
  IR_SECTIONS,
  blankIncidentWorkspace,
  eventFromArtifactLine,
  eventsMissingEvidence,
  importSocTimelines,
  incidentReportToMarkdown,
  irQualityChecklist,
  modelTimelineCoverage,
  normalizeIncidentWorkspaces,
} from './incidentResponse'

const incident = INCIDENTS[0]

function modelWorkspace(): IncidentWorkspace {
  const workspace = blankIncidentWorkspace(incident, 1)
  workspace.events = incident.modelTimeline.map((entry, index) => {
    const artifact = incident.artifacts.find((item) => item.id === entry.artifactId)!
    return { id: `e${index}`, time: entry.time, source: entry.source, observation: entry.observation, confidence: entry.confidence, evidence: `${artifact.label} L${entry.line}` }
  })
  for (const section of IR_SECTIONS) workspace.report[section.key] = incident.modelReport[section.key]
  return workspace
}

describe('incident content', () => {
  it('has a consistent model timeline, full model report, related SOC challenges, and passes the safety audit', () => {
    for (const entry of incident.modelTimeline) {
      const artifact = incident.artifacts.find((item) => item.id === entry.artifactId)
      expect(artifact?.lines[entry.line - 1]).toContain(entry.time)
    }
    for (const section of IR_SECTIONS) expect(incident.modelReport[section.key].length).toBeGreaterThan(40)
    for (const id of incident.relatedSocChallenges) expect(trackChallengeById(id)?.track).toBe('soc')
    const text = [incident.summary, ...incident.artifacts.flatMap((artifact) => artifact.lines), ...incident.modelTimeline.map((entry) => entry.observation), ...Object.values(incident.modelReport)].join('\n')
    expect(auditFields([{ field: 'incident', text, mode: 'artifact' }]).filter((finding) => finding.severity === 'blocker')).toEqual([])
  })
})

describe('incident workspace', () => {
  it('turns artifact lines into timeline events with time and evidence', () => {
    const event = eventFromArtifactLine(incident, 'auth-log', 5)!
    expect(event).toMatchObject({ time: '2026-05-19T02:49:58Z', confidence: 'medium', evidence: `${incident.artifacts[0].label} L5` })
    expect(eventFromArtifactLine(incident, 'auth-log', 99)).toBeNull()
  })

  it('passes every quality check with the model timeline and report', () => {
    const workspace = modelWorkspace()
    expect(irQualityChecklist(workspace).filter((check) => !check.passed)).toEqual([])
    expect(modelTimelineCoverage(incident, workspace)).toMatchObject({ matched: incident.modelTimeline.length })
  })

  it('warns about missing evidence and empty sections', () => {
    const workspace = modelWorkspace()
    workspace.events[0] = { ...workspace.events[0], evidence: ' ' }
    workspace.report.recovery = ''
    expect(eventsMissingEvidence(workspace.events)).toHaveLength(1)
    const failed = irQualityChecklist(workspace).filter((check) => !check.passed).map((check) => check.id)
    expect(failed).toEqual(['evidence', 'sections'])
    const markdown = incidentReportToMarkdown(incident, workspace, 0)
    expect(markdown).toContain('**Missing evidence:** 1 timeline event(s) cite no evidence.')
    for (const heading of ['## Incident Summary', '## Impact', '## Timeline', '## Containment', '## Eradication', '## Recovery', '## Lessons Learned', '## Report Quality Checklist']) {
      expect(markdown).toContain(heading)
    }
  })

  it('imports SOC track timelines once', () => {
    const soc = trackChallengeById(incident.relatedSocChallenges[0])!
    const submission: TrackSubmission = {
      id: 's1',
      challengeId: soc.id,
      selectedLines: soc.answerLines,
      classification: soc.classification.answer,
      writeups: {},
      timeline: soc.timeline!.map((entry) => ({ time: entry.time, line: entry.line, observation: entry.observation })),
      correct: true,
      scorePct: 100,
      at: 1,
    }
    const first = importSocTimelines(blankIncidentWorkspace(incident), incident, TRACK_CHALLENGES, [submission])
    expect(first.added).toBe(soc.timeline!.length)
    expect(first.workspace.events.every((event) => event.evidence.startsWith(soc.id))).toBe(true)
    expect(importSocTimelines(first.workspace, incident, TRACK_CHALLENGES, [submission]).added).toBe(0)
  })

  it('normalizes stored workspaces', () => {
    const normalized = normalizeIncidentWorkspaces({
      [incident.id]: { events: [{ id: 'x', time: '2026-05-19T02:49:58Z', source: 's', observation: 'o', confidence: 'certain', evidence: 'e' }, 'junk'], report: { summary: 'S', impact: 7 } },
      'IR-99': {},
    }, INCIDENTS)
    expect(Object.keys(normalized)).toEqual([incident.id])
    expect(normalized[incident.id].events).toEqual([{ id: 'x', time: '2026-05-19T02:49:58Z', source: 's', observation: 'o', confidence: 'medium', evidence: 'e' }])
    expect(normalized[incident.id].report).toMatchObject({ summary: 'S', impact: '' })
  })
})
