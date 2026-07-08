import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { labById } from '../data/labs'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const SEV_CLASS: Record<string, string> = {
  critical: 'badge--red',
  high: 'badge--red',
  medium: 'badge--amber',
  low: 'badge--cyan',
  info: 'badge--purple',
}

export function LabDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const lab = labById(id)

  const [ack, setAck] = useState(false)
  const [done, setDone] = useState<boolean[]>(() => (lab ? lab.objectives.map(() => false) : []))
  const [openHints, setOpenHints] = useState<Set<number>>(new Set())
  const [showModel, setShowModel] = useState(false)

  if (!lab) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Panel>
          <EmptyState glyph="⌀" title="Lab not found">
            <button className="btn btn--primary" onClick={() => navigate('/labs')}>
              ← Safe Labs
            </button>
          </EmptyState>
        </Panel>
      </div>
    )
  }

  const toggleHint = (i: number) =>
    setOpenHints((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })

  const doneCount = done.filter(Boolean).length

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>Safe Lab // {lab.category}</>}
        title={lab.title}
        actions={
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/labs')}>
            ← Labs
          </button>
        }
      />

      {/* Scope contract gate */}
      <Panel className="mb-3" style={{ borderColor: ack ? 'var(--hairline)' : 'rgba(255,204,0,0.4)' }}>
        <div className="panel__title" style={{ color: 'var(--warning-amber)' }}>
          <span style={{ background: 'var(--warning-amber)' }} /> Scope Contract
        </div>
        <div className="grid-2 mt-2" style={{ gap: '1rem' }}>
          <div>
            <div className="term t-xs neon-green upper mb-1">Allowed</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }} className="t-sm muted">
              {lab.scope.allowed.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="term t-xs neon-red upper mb-1">Forbidden</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }} className="t-sm muted">
              {lab.scope.forbidden.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
        {!ack && (
          <label className="toggle mt-3">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span className="toggle__track" />
            <span className="t-sm">I will stay within this synthetic, read-only scope.</span>
          </label>
        )}
      </Panel>

      {ack && (
        <>
          <Panel title="Briefing" className="mb-3">
            <p className="muted">{lab.brief}</p>
          </Panel>

          <div className="grid-dash">
            <div className="stack">
              <Panel title={lab.evidenceTitle}>
                <pre style={{ background: 'var(--bg-abyss)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '0.9rem', overflowX: 'auto', fontSize: '0.82rem', lineHeight: 1.55 }}>
                  <code>{lab.evidence}</code>
                </pre>
              </Panel>

              <Panel title="Guiding Questions">
                <div className="stack stack--sm">
                  {lab.guiding.map((g, i) => (
                    <div key={i} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.7rem 0.85rem' }}>
                      <div className="row row--between" style={{ gap: '0.5rem' }}>
                        <span className="t-sm" style={{ color: 'var(--text-main)' }}>
                          {g.q}
                        </span>
                        <button className="btn btn--ghost btn--sm" onClick={() => toggleHint(i)}>
                          {openHints.has(i) ? 'hide' : 'reveal'}
                        </button>
                      </div>
                      {openHints.has(i) && <p className="muted t-sm mt-1">{g.a}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="stack">
              <Panel title="Objectives" right={<span className="term t-xs dim">{doneCount}/{lab.objectives.length}</span>}>
                <div className="stack stack--sm">
                  {lab.objectives.map((o, i) => (
                    <label key={i} className="row clickable" style={{ gap: '0.6rem', alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        checked={done[i]}
                        onChange={(e) => setDone((d) => d.map((v, j) => (j === i ? e.target.checked : v)))}
                        style={{ marginTop: 3 }}
                      />
                      <span className="t-sm" style={{ textDecoration: done[i] ? 'line-through' : 'none', opacity: done[i] ? 0.6 : 1 }}>
                        {o}
                      </span>
                    </label>
                  ))}
                </div>
              </Panel>

              <Panel title="Deliverable">
                <p className="term t-xs dim mb-2">Write up what you found. Draft a report seeded with this lab's context.</p>
                <button className="btn btn--primary btn--block" onClick={() => navigate('/reports', { state: { prefillLab: lab } })}>
                  ⎙ Draft report
                </button>
              </Panel>

              <Panel title="Model Answer" right={<button className="btn btn--ghost btn--sm" onClick={() => setShowModel((v) => !v)}>{showModel ? 'hide' : 'reveal'}</button>}>
                {showModel ? (
                  <div className="stack stack--sm">
                    {lab.modelFindings.map((f, i) => (
                      <div key={i} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.7rem 0.85rem' }}>
                        <div className="row wrap mb-1" style={{ gap: '0.4rem' }}>
                          <span className={`badge ${SEV_CLASS[f.severity]}`}>{f.severity}</span>
                          <span className="t-sm" style={{ color: 'var(--text-main)' }}>
                            {f.title}
                          </span>
                        </div>
                        <p className="term t-xs muted">
                          <strong>Impact:</strong> {f.impact}
                        </p>
                        <p className="term t-xs muted">
                          <strong>Fix:</strong> {f.remediation}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="term t-xs dim">Attempt the objectives first, then reveal the model findings to self-assess.</p>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
