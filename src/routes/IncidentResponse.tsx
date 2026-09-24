import { useState } from 'react'
import { Link } from 'react-router-dom'
import { INCIDENTS } from '../data/tracks/incidents'
import type { TimelineConfidence } from '../data/tracks/types'
import type { IncidentTimelineEvent, IncidentWorkspace } from '../types'
import { useStore } from '../store/useStore'
import {
  CONFIDENCES,
  IR_SECTIONS,
  blankIncidentWorkspace,
  eventFromArtifactLine,
  eventsMissingEvidence,
  incidentReportToMarkdown,
  irQualityChecklist,
  modelTimelineCoverage,
  sortEvents,
} from '../lib/incidentResponse'
import { uid } from '../lib/id'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function IncidentResponse() {
  const incident = INCIDENTS[0]
  const stored = useStore((s) => s.incidentWorkspaces[incident.id])
  const saveIncidentWorkspace = useStore((s) => s.saveIncidentWorkspace)
  const importSocTimelinesToIncident = useStore((s) => s.importSocTimelinesToIncident)
  const resetIncident = useStore((s) => s.resetIncident)
  const workspace: IncidentWorkspace = stored ?? blankIncidentWorkspace(incident)
  const [artifactId, setArtifactId] = useState(incident.artifacts[0].id)
  const [notice, setNotice] = useState('')
  const [showModel, setShowModel] = useState(false)
  const artifact = incident.artifacts.find((item) => item.id === artifactId)!
  const checks = irQualityChecklist(workspace)
  const missingEvidence = eventsMissingEvidence(workspace.events)
  const coverage = modelTimelineCoverage(incident, workspace)

  const save = (patch: Partial<IncidentWorkspace>) => saveIncidentWorkspace({ ...workspace, ...patch })
  const patchEvent = (id: string, patch: Partial<IncidentTimelineEvent>) =>
    save({ events: workspace.events.map((event) => (event.id === id ? { ...event, ...patch } : event)) })
  const addLine = (line: number) => {
    const event = eventFromArtifactLine(incident, artifact.id, line)
    if (!event) return
    save({ events: sortEvents([...workspace.events, event]) })
    setNotice(`Added ${artifact.label} L${line} to the timeline — write what it shows.`)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="CEH+ // Incident Response"
        title={incident.title}
        sub={incident.summary}
        actions={<Link className="btn btn--ghost btn--sm" to="/beyond">← CEH+ Tracks</Link>}
      />
      <Panel className="mb-3" brackets>
        <div className="row row--between wrap" style={{ gap: '0.6rem' }}>
          <span className="term t-xs dim">{incident.organization} · synthetic artifacts only · no real systems or data</span>
          <span className={`badge ${checks.every((check) => check.passed) ? 'badge--green' : 'badge--amber'}`}>
            quality {checks.filter((check) => check.passed).length}/{checks.length}
          </span>
        </div>
      </Panel>

      {missingEvidence.length > 0 && (
        <div className="t-sm mb-3" role="alert" style={{ color: 'var(--warning-amber)', border: '1px solid rgba(255,204,0,0.35)', borderRadius: 'var(--r-md)', background: 'rgba(255,204,0,0.06)', padding: '0.75rem 0.85rem' }}>
          Missing evidence: {missingEvidence.length} timeline event{missingEvidence.length === 1 ? '' : 's'} cite no related evidence. Add an
          artifact line, Evidence Vault title, or SOC challenge reference before exporting.
        </div>
      )}

      <div className="grid-dash">
        <div className="stack">
          <Panel title="Synthetic artifacts">
            <div className="row wrap mb-2" style={{ gap: '0.3rem' }} role="tablist">
              {incident.artifacts.map((item) => (
                <button key={item.id} role="tab" aria-selected={item.id === artifactId} className={`chip ${item.id === artifactId ? 'chip--active' : ''}`} onClick={() => setArtifactId(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <p className="term t-xs dim">Click a line to add it to the timeline as a new event.</p>
            <div className="dataset-view" role="group" aria-label={`${artifact.label} lines`}>
              {artifact.lines.map((text, index) => {
                const used = workspace.events.some((event) => event.evidence === `${artifact.label} L${index + 1}`)
                return (
                  <button key={index} type="button" className={`dataset-view__line ${used ? 'is-selected' : ''}`} onClick={() => addLine(index + 1)} aria-label={`Add line ${index + 1} to timeline`}>
                    <span className="dataset-view__no">{index + 1}</span>
                    <code className="dataset-view__text">{text}</code>
                  </button>
                )
              })}
            </div>
            {notice && <p className="term t-xs neon-green mt-2" style={{ marginBottom: 0 }} role="status">{notice}</p>}
          </Panel>

          <Panel
            title="Incident timeline"
            right={
              <div className="row wrap" style={{ gap: '0.35rem' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => {
                  const added = importSocTimelinesToIncident(incident.id)
                  setNotice(added > 0 ? `Imported ${added} event(s) from your SOC track timelines.` : `No new SOC timeline events. Build timelines in ${incident.relatedSocChallenges.join(', ')} first.`)
                }}>
                  ⇣ Import SOC timelines
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => save({ events: sortEvents([...workspace.events, { id: uid('ie-'), time: '', source: 'Analyst note', observation: '', confidence: 'low', evidence: '' }]) })}>
                  ＋ Manual event
                </button>
              </div>
            }
          >
            {workspace.events.length === 0 ? (
              <p className="term t-xs dim" style={{ marginBottom: 0 }}>No events yet. Add artifact lines, import SOC timelines, or add a manual event.</p>
            ) : (
              <div className="stack stack--sm">
                {sortEvents(workspace.events).map((event) => (
                  <div key={event.id} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.6rem 0.7rem' }}>
                    <div className="row wrap" style={{ gap: '0.4rem' }}>
                      <input className="input" style={{ width: 205 }} aria-label="Event time (ISO-8601 UTC)" value={event.time} placeholder="2026-05-19T02:49:58Z" onChange={(e) => patchEvent(event.id, { time: e.target.value })} />
                      <input className="input grow" style={{ minWidth: 150 }} aria-label="Event source" value={event.source} onChange={(e) => patchEvent(event.id, { source: e.target.value })} />
                      <select className="select" style={{ width: 110 }} aria-label="Confidence" value={event.confidence} onChange={(e) => patchEvent(event.id, { confidence: e.target.value as TimelineConfidence })}>
                        {CONFIDENCES.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                      <button className="btn btn--danger btn--sm" aria-label="Remove event" onClick={() => save({ events: workspace.events.filter((item) => item.id !== event.id) })}>✕</button>
                    </div>
                    <input className="input mt-1" aria-label="Observation" value={event.observation} placeholder="Observation: what does this event show?" onChange={(e) => patchEvent(event.id, { observation: e.target.value })} />
                    <input
                      className="input mt-1"
                      aria-label="Related evidence"
                      value={event.evidence}
                      placeholder="Related evidence (artifact line, Vault item, SOC challenge)"
                      style={!event.evidence.trim() ? { borderColor: 'var(--warning-amber)' } : undefined}
                      onChange={(e) => patchEvent(event.id, { evidence: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="row wrap mt-2" style={{ gap: '0.4rem' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => setShowModel((value) => !value)}>
                {showModel ? 'Hide model timeline' : `Compare with model timeline (${coverage.matched}/${coverage.total} matched)`}
              </button>
            </div>
            {showModel && (
              <div className="mt-2">
                {incident.modelTimeline.map((entry) => (
                  <p key={`${entry.time}-${entry.artifactId}`} className={`term t-xs ${coverage.missing.includes(entry) ? 'neon-amber' : 'neon-green'}`} style={{ margin: '0 0 0.25rem' }}>
                    {entry.time} · {entry.source} · {entry.confidence} — {entry.observation}
                  </p>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="stack">
          <Panel title="IR report">
            {IR_SECTIONS.map((section) => (
              <div className="field" key={section.key}>
                <label className="label" htmlFor={`ir-${section.key}`}>{section.label}</label>
                <textarea
                  id={`ir-${section.key}`}
                  className="textarea"
                  style={{ minHeight: 60 }}
                  placeholder={section.prompt}
                  value={workspace.report[section.key]}
                  onChange={(e) => save({ report: { ...workspace.report, [section.key]: e.target.value } })}
                />
              </div>
            ))}
            {showModel && (
              <details className="mb-2">
                <summary className="term t-xs">Model report</summary>
                {IR_SECTIONS.map((section) => (
                  <p key={section.key} className="term t-xs muted"><strong>{section.label}:</strong> {incident.modelReport[section.key]}</p>
                ))}
              </details>
            )}
            <button className="btn btn--green btn--block" onClick={() => download(`incident-report-${incident.id.toLowerCase()}.md`, incidentReportToMarkdown(incident, workspace))}>
              ⤓ Export IR report (Markdown)
            </button>
          </Panel>

          <Panel title="Report quality checklist">
            <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {checks.map((check) => (
                <li key={check.id} className="row" style={{ gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span className={`badge ${check.passed ? 'badge--green' : 'badge--amber'}`} aria-hidden="true">{check.passed ? '✓' : '!'}</span>
                  <span>
                    <span className="t-sm">{check.label}</span>
                    <span className="sr-only">{check.passed ? ' — passed' : ' — not yet'}</span>
                    {!check.passed && <span className="term t-xs dim" style={{ display: 'block' }}>{check.detail}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <button className="btn btn--danger btn--sm" onClick={() => { if (window.confirm('Clear this incident timeline and report?')) resetIncident(incident.id) }}>
            Reset incident
          </button>
        </div>
      </div>
    </div>
  )
}
