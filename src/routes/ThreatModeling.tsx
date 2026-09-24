import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { THREAT_MODEL_SCENARIOS } from '../data/tracks/threatModel'
import type { StrideKey, ThreatPriority } from '../data/tracks/types'
import type { LearnerThreat, ThreatModelWork } from '../types'
import { useStore } from '../store/useStore'
import { moduleMeta } from '../data/taxonomy'
import {
  BACKLOG_STATUSES,
  PRIORITIES,
  STRIDE,
  STRIDE_KEYS,
  backlogToMarkdown,
  blankLearnerThreat,
  blankThreatModelWork,
  remediationBacklog,
  reviewThreatModel,
  suggestedCehConcept,
  targetLabel,
} from '../lib/threatModel'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function ThreatModelList() {
  const works = useStore((s) => s.threatModels)
  return (
    <div className="page">
      <PageHeader
        eyebrow="CEH+ // Threat Modeling & Remediation"
        title="Threat Modeling Scenarios"
        sub="Turn attacker thinking into defensive design: rate assets, describe trust boundaries, model STRIDE threats, and build a remediation backlog for fictional architectures."
        actions={<Link className="btn btn--ghost btn--sm" to="/beyond">← CEH+ Tracks</Link>}
      />
      <div className="grid-cards">
        {THREAT_MODEL_SCENARIOS.map((scenario) => {
          const work = works[scenario.id]
          const review = work ? reviewThreatModel(scenario, work) : null
          return (
            <Link key={scenario.id} to={`/tracks/threat-model/${scenario.id}`} className="neon-card">
              <div className="row row--between">
                <span className="badge badge--cyan">{scenario.id}</span>
                <span className={`diff diff--${scenario.difficulty}`}>◆ {scenario.difficulty}</span>
              </div>
              <h3 className="display mt-1" style={{ fontSize: '0.95rem' }}>{scenario.title}</h3>
              <div className="row wrap mt-1" style={{ gap: '0.3rem' }}>
                <span className="badge">{scenario.requiredStride.join('')}</span>
                <span className={`badge ${review?.complete ? 'badge--green' : review ? 'badge--amber' : ''}`}>
                  {review?.complete ? 'model complete' : work ? `${work.threats.length} threats` : 'new'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function ThreatModelDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const scenario = THREAT_MODEL_SCENARIOS.find((item) => item.id === id)
  const stored = useStore((s) => (scenario ? s.threatModels[scenario.id] : undefined))
  const saveThreatModel = useStore((s) => s.saveThreatModel)
  const threatModelToReport = useStore((s) => s.threatModelToReport)
  const [showModel, setShowModel] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!scenario) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Panel><EmptyState glyph="⌀" title="Scenario not found"><Link className="btn btn--primary" to="/tracks/threat-model">← Scenarios</Link></EmptyState></Panel>
      </div>
    )
  }

  const work: ThreatModelWork = stored ?? blankThreatModelWork(scenario)
  const review = reviewThreatModel(scenario, work)
  const backlog = remediationBacklog(work)
  const save = (patch: Partial<ThreatModelWork>) => saveThreatModel({ ...work, ...patch })
  const patchThreat = (threatId: string, patch: Partial<LearnerThreat>) =>
    save({ threats: work.threats.map((threat) => (threat.id === threatId ? { ...threat, ...patch } : threat)) })
  const targets = [
    ...scenario.dataFlows.map((flow) => ({ id: flow.id, label: `Flow: ${targetLabel(scenario, flow.id)}${flow.boundary ? ` [crosses ${flow.boundary.toUpperCase()}]` : ''}` })),
    ...scenario.components.map((component) => ({ id: component.id, label: `Element: ${component.name}` })),
  ]

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>CEH+ // Threat Modeling // {scenario.id}</>}
        title={scenario.title}
        sub={scenario.system}
        actions={<Link className="btn btn--ghost btn--sm" to="/tracks/threat-model">← Scenarios</Link>}
      />
      <div className="grid-dash">
        <div className="stack">
          <Panel title="Data-flow diagram (fictional)">
            <pre style={{ background: 'var(--bg-abyss)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '0.8rem', fontSize: '0.78rem', overflowX: 'auto', margin: 0 }}>
              <code>{scenario.diagram.join('\n')}</code>
            </pre>
            <div className="row wrap mt-2" style={{ gap: '0.3rem' }}>
              {scenario.cehModules.map((module) => <span key={module} className="badge badge--cyan">M{module} {moduleMeta(module)?.short}</span>)}
              {scenario.skills.map((skill) => <span key={skill} className="badge badge--purple">{skill}</span>)}
            </div>
          </Panel>

          <Panel title="Assets" right={<span className="term t-xs dim">{review.assetsRated}/{scenario.assets.length} rated</span>}>
            <div className="stack stack--sm">
              {scenario.assets.map((asset) => {
                const rating = work.assetRatings[asset.id]
                return (
                  <div key={asset.id} className="row row--between wrap" style={{ gap: '0.4rem' }}>
                    <span className="t-sm">{asset.name}</span>
                    <div className="row" style={{ gap: '0.25rem' }} role="radiogroup" aria-label={`Sensitivity of ${asset.name}`}>
                      {(['high', 'medium', 'low'] as const).map((level) => (
                        <button key={level} role="radio" aria-checked={rating === level} className={`chip ${rating === level ? 'chip--active' : ''}`} onClick={() => save({ assetRatings: { ...work.assetRatings, [asset.id]: level } })}>
                          {level}
                        </button>
                      ))}
                      {showModel && rating && <span className={`term t-xs ${rating === asset.sensitivity ? 'neon-green' : 'neon-amber'}`}>model: {asset.sensitivity}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel title="Trust boundaries">
            {scenario.boundaries.map((boundary) => (
              <div className="field" key={boundary.id}>
                <label className="label" htmlFor={`boundary-${boundary.id}`}>{boundary.id.toUpperCase()} · {boundary.name}</label>
                <p className="term t-xs dim" style={{ margin: '0 0 0.3rem' }}>{boundary.description}</p>
                <input
                  id={`boundary-${boundary.id}`}
                  className="input"
                  placeholder="What must be authenticated, validated, or limited when data crosses here?"
                  value={work.boundaryNotes[boundary.id] ?? ''}
                  onChange={(e) => save({ boundaryNotes: { ...work.boundaryNotes, [boundary.id]: e.target.value } })}
                />
              </div>
            ))}
          </Panel>

          <Panel
            title="Threats (STRIDE)"
            right={<button className="btn btn--primary btn--sm" onClick={() => save({ threats: [...work.threats, blankLearnerThreat(scenario)] })}>＋ Threat</button>}
          >
            <div className="row wrap mb-2" style={{ gap: '0.3rem' }}>
              {scenario.requiredStride.map((key) => (
                <span key={key} className={`badge ${review.strideCovered.includes(key) ? 'badge--green' : 'badge--amber'}`}>{key} · {STRIDE[key]}</span>
              ))}
            </div>
            {work.threats.length === 0 && <p className="term t-xs dim">Add at least one threat for each required STRIDE category.</p>}
            <div className="stack stack--sm">
              {work.threats.map((threat) => {
                const concept = suggestedCehConcept(scenario, threat)
                return (
                  <div key={threat.id} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.65rem 0.75rem' }}>
                    <div className="row wrap" style={{ gap: '0.4rem' }}>
                      <select className="select" style={{ width: 190 }} aria-label="STRIDE category" value={threat.stride} onChange={(e) => patchThreat(threat.id, { stride: e.target.value as StrideKey })}>
                        {STRIDE_KEYS.map((key) => <option key={key} value={key}>{key} · {STRIDE[key]}</option>)}
                      </select>
                      <select className="select grow" style={{ minWidth: 200 }} aria-label="Target element or flow" value={threat.target} onChange={(e) => patchThreat(threat.id, { target: e.target.value })}>
                        {targets.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
                      </select>
                      <button className="btn btn--danger btn--sm" aria-label="Remove threat" onClick={() => save({ threats: work.threats.filter((item) => item.id !== threat.id) })}>✕</button>
                    </div>
                    <input className="input mt-1" aria-label="Threat" placeholder="Threat: what could go wrong at this element or flow?" value={threat.threat} onChange={(e) => patchThreat(threat.id, { threat: e.target.value })} />
                    <input className="input mt-1" aria-label="Mitigation" placeholder="Mitigation: the design control that prevents or limits it" value={threat.mitigation} onChange={(e) => patchThreat(threat.id, { mitigation: e.target.value })} />
                    <div className="row wrap mt-1" style={{ gap: '0.4rem', alignItems: 'center' }}>
                      <select className="select" style={{ width: 90 }} aria-label="Priority" value={threat.priority} onChange={(e) => patchThreat(threat.id, { priority: e.target.value as ThreatPriority })}>
                        {PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                      {concept && <span className="term t-xs dim">CEH link: {threat.cehConcept || concept}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
            <button className="btn btn--ghost btn--sm mt-2" onClick={() => setShowModel((value) => !value)}>{showModel ? 'Hide model threats' : 'Compare with model threats'}</button>
            {showModel && (
              <div className="stack stack--sm mt-2">
                {scenario.modelThreats.map((threat) => (
                  <p key={threat.id} className="term t-xs muted" style={{ margin: 0 }}>
                    <strong>{threat.priority} · {STRIDE[threat.stride]}</strong> on {targetLabel(scenario, threat.target)} — {threat.threat} <span className="neon-green">Mitigation: {threat.mitigation}</span> ({threat.cehConcept})
                  </p>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="stack">
          <Panel title="Model status" right={<span className={`badge ${review.complete ? 'badge--green' : 'badge--amber'}`}>{review.complete ? 'complete' : 'in progress'}</span>}>
            {review.assetsRated > 0 && <p className="term t-xs">Asset sensitivity accuracy: {review.assetAccuracyPct}%</p>}
            {review.blockers.length > 0 ? (
              <ul className="term t-xs neon-amber" style={{ paddingLeft: '1.1rem', margin: 0 }}>
                {review.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            ) : (
              <p className="term t-xs neon-green" style={{ margin: 0 }}>Assets, boundaries, and every required STRIDE category are covered.</p>
            )}
          </Panel>

          <Panel title="Remediation backlog" right={<span className="term t-xs dim">{backlog.length} items</span>}>
            {backlog.length === 0 ? (
              <p className="term t-xs dim" style={{ margin: 0 }}>Threats with a mitigation appear here, ordered by priority.</p>
            ) : (
              <div className="stack stack--sm">
                {backlog.map((threat) => (
                  <div key={threat.id} className="row wrap" style={{ gap: '0.4rem', alignItems: 'center' }}>
                    <span className={`badge ${threat.priority === 'P1' ? 'badge--red' : threat.priority === 'P2' ? 'badge--amber' : 'badge--cyan'}`}>{threat.priority}</span>
                    <span className="t-sm grow" style={{ minWidth: 160 }}>{threat.mitigation}</span>
                    <select className="select" style={{ width: 125 }} aria-label="Backlog status" value={threat.status} onChange={(e) => patchThreat(threat.id, { status: e.target.value as LearnerThreat['status'] })}>
                      {BACKLOG_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div className="row wrap mt-3" style={{ gap: '0.4rem' }}>
              <button className="btn btn--green btn--sm" disabled={backlog.length === 0} onClick={() => download(`backlog-${scenario.id.toLowerCase()}.md`, backlogToMarkdown(scenario, work))}>⤓ Backlog Markdown</button>
              <button
                className="btn btn--primary btn--sm"
                disabled={backlog.length === 0}
                onClick={() => {
                  const reportId = threatModelToReport(scenario.id)
                  setMessage(reportId ? reportId : null)
                }}
              >
                ⎙ Send to Report Builder
              </button>
              {message && <button className="btn btn--ghost btn--sm" onClick={() => navigate('/reports', { state: { openReportId: message } })}>Open report →</button>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
