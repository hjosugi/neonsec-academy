import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { labById } from '../data/labs'
import type { Lab, LabRubric, LabRubricComponent } from '../data/labs'
import { useStore } from '../store/useStore'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'
import { ChallengeEvidenceVault } from '../components/lab/ChallengeEvidenceVault'

const SEV_CLASS: Record<string, string> = {
  critical: 'badge--red',
  high: 'badge--red',
  medium: 'badge--amber',
  low: 'badge--cyan',
  info: 'badge--purple',
}

const LAB_PROGRESS_PREFIX = 'neonsec-academy:lab-progress:'

type LabProgress = {
  ack: boolean
  done: boolean[]
  revealedHints: Set<number>
}

type ScoreRow = LabRubricComponent & {
  earned: number
  reportEarned: number
  blockers: string[]
}

function blankProgress(lab?: Lab): LabProgress {
  return {
    ack: false,
    done: lab ? lab.objectives.map(() => false) : [],
    revealedHints: new Set(),
  }
}

function progressKey(lab: Lab) {
  return `${LAB_PROGRESS_PREFIX}${lab.id}`
}

function readLabProgress(lab?: Lab): LabProgress {
  if (!lab || typeof window === 'undefined') return blankProgress(lab)

  try {
    const raw = window.localStorage.getItem(progressKey(lab))
    if (!raw) return blankProgress(lab)
    const parsed = JSON.parse(raw) as Partial<{ ack: boolean; done: boolean[]; revealedHints: number[] }>
    const done = lab.objectives.map((_, i) => Boolean(parsed.done?.[i]))
    const revealedHints = new Set(
      (parsed.revealedHints ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < lab.guiding.length),
    )

    return { ack: parsed.ack === true, done, revealedHints }
  } catch {
    return blankProgress(lab)
  }
}

function writeLabProgress(lab: Lab, ack: boolean, done: boolean[], revealedHints: Set<number>) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(
      progressKey(lab),
      JSON.stringify({
        ack,
        done: lab.objectives.map((_, i) => Boolean(done[i])),
        revealedHints: [...revealedHints],
      }),
    )
  } catch {
    // Progress persistence is best-effort; scoring still works for the current session.
  }
}

function reportTitle(lab: Lab) {
  return `Report — ${lab.title}`
}

function reportScope(lab: Lab) {
  return `Synthetic lab: ${lab.category}. Allowed: ${lab.scope.allowed.join('; ')}.`
}

function isReportForLab(report: { challengeId?: string; title: string; scope: string; summary: string }, lab: Lab) {
  return report.challengeId === lab.id || report.title === reportTitle(lab) || (report.scope === reportScope(lab) && report.summary === lab.brief)
}

function objectivesReady(component: LabRubricComponent, done: boolean[]) {
  const indexes = component.objectiveIndexes ?? []
  return indexes.length === 0 || indexes.every((i) => Boolean(done[i]))
}

function scoreLab(rubric: LabRubric, done: boolean[], ack: boolean, hasReport: boolean, revealedHintCount: number) {
  const rows: ScoreRow[] = rubric.components.map((component) => {
    const reportPoints = component.reportPoints ?? 0
    const basePoints = component.points - reportPoints
    const ready = objectivesReady(component, done)
    const earned = ready && ack ? basePoints + (hasReport ? reportPoints : 0) : 0
    const missing = (component.objectiveIndexes ?? []).filter((i) => !done[i])
    const blockers: string[] = []

    if (!ack) blockers.push('acknowledge scope')
    if (missing.length > 0) blockers.push(`objective ${missing.map((i) => `#${i + 1}`).join(', ')}`)
    if (reportPoints > 0 && !hasReport) blockers.push('submit report')

    return {
      ...component,
      earned,
      reportEarned: ready && ack && hasReport ? reportPoints : 0,
      blockers,
    }
  })

  const max = rows.reduce((sum, row) => sum + row.points, 0)
  const subtotal = rows.reduce((sum, row) => sum + row.earned, 0)
  const hintPenalty = revealedHintCount * rubric.hintPenalty
  const scopePenalty = ack ? 0 : rubric.scopeWarningPenalty
  const score = Math.max(0, Math.min(max, subtotal - hintPenalty - scopePenalty))
  const pct = max > 0 ? Math.round((score / max) * 100) : 0

  return {
    rows,
    max,
    subtotal,
    hintPenalty,
    scopePenalty,
    score,
    pct,
    passed: pct >= rubric.passingScore,
  }
}

function scoreBadgeClass(pct: number) {
  if (pct >= 80) return 'badge--green'
  if (pct >= 50) return 'badge--amber'
  return 'badge--red'
}

function scoreColor(pct: number) {
  if (pct >= 80) return 'var(--acid-green)'
  if (pct >= 50) return 'var(--warning-amber)'
  return 'var(--danger-red)'
}

export function LabDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const lab = labById(id)
  const reports = useStore((s) => s.reports)
  const settings = useStore((s) => s.settings)

  const [progressLabId, setProgressLabId] = useState(lab?.id ?? '')
  const [ack, setAck] = useState(() => readLabProgress(lab).ack)
  const [done, setDone] = useState<boolean[]>(() => readLabProgress(lab).done)
  const [openHints, setOpenHints] = useState<Set<number>>(new Set())
  const [revealedHints, setRevealedHints] = useState<Set<number>>(() => readLabProgress(lab).revealedHints)
  const [showModel, setShowModel] = useState(false)

  useEffect(() => {
    const progress = readLabProgress(lab)
    setAck(progress.ack)
    setDone(progress.done)
    setOpenHints(new Set())
    setRevealedHints(progress.revealedHints)
    setShowModel(false)
    setProgressLabId(lab?.id ?? '')
  }, [lab?.id])

  useEffect(() => {
    if (!lab || progressLabId !== lab.id) return
    writeLabProgress(lab, ack, done, revealedHints)
  }, [ack, done, lab, progressLabId, revealedHints])

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

  const effectiveRubric: LabRubric = {
    ...lab.rubric,
    passingScore: settings.labPassingScore ?? lab.rubric.passingScore,
    hintPenalty: settings.labHintPenalty ?? lab.rubric.hintPenalty,
    scopeWarningPenalty: settings.labScopeWarningPenalty ?? lab.rubric.scopeWarningPenalty,
  }
  const labReport = reports.find((report) => isReportForLab(report, lab))
  const hasReport = Boolean(labReport)
  const score = scoreLab(effectiveRubric, done, ack, hasReport, revealedHints.size)
  const meterStyle = { '--v': `${score.pct}%`, '--c': scoreColor(score.pct) } as CSSProperties
  const doneCount = done.filter(Boolean).length

  const toggleHint = (i: number) => {
    const willReveal = !openHints.has(i)
    setOpenHints((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
    if (willReveal) {
      setRevealedHints((s) => {
        const n = new Set(s)
        n.add(i)
        return n
      })
    }
  }

  const openReport = () => {
    if (labReport) navigate('/reports', { state: { openReportId: labReport.id } })
    else navigate('/reports', { state: { prefillLab: lab } })
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>Safe Lab // {lab.category} // {lab.kind}</>}
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

      <Panel
        title="Lab Summary"
        className="mb-3"
        right={<span className={`badge ${scoreBadgeClass(score.pct)}`}>{score.passed ? 'passing' : 'incomplete'}</span>}
      >
        <div className="row row--between wrap" style={{ gap: '0.8rem' }}>
          <div>
            <div className="stat__value">{score.pct}%</div>
            <div className="stat__label">
              {score.score}/{score.max} points · pass {effectiveRubric.passingScore}%
            </div>
          </div>
          <div className="row wrap" style={{ gap: '0.4rem', justifyContent: 'flex-end' }}>
            <span className="badge badge--cyan">{effectiveRubric.challengeType}</span>
            <span className="badge badge--purple">{lab.kind}</span>
            <span className={`badge ${hasReport ? 'badge--green' : 'badge--amber'}`}>
              report {hasReport ? 'submitted' : 'missing'}
            </span>
            <span className={`badge ${ack ? 'badge--green' : 'badge--red'}`}>{ack ? 'scope acknowledged' : 'scope warning'}</span>
          </div>
        </div>

        <div className="meter meter--tall mt-2" style={meterStyle}>
          <div className="meter__fill" />
        </div>

        <div className="grid-3 mt-3">
          <div className="stat">
            <div className="stat__value" style={{ fontSize: '1.25rem' }}>
              {doneCount}/{lab.objectives.length}
            </div>
            <div className="stat__label">Objectives</div>
          </div>
          <div className="stat">
            <div className="stat__value" style={{ fontSize: '1.25rem' }}>
              -{score.hintPenalty}
            </div>
            <div className="stat__label">Hint penalty</div>
          </div>
          <div className="stat">
            <div className="stat__value" style={{ fontSize: '1.25rem' }}>
              -{score.scopePenalty}
            </div>
            <div className="stat__label">Scope warning</div>
          </div>
        </div>

        <div className="mt-3">
          {score.rows.map((row) => (
            <div key={row.key} style={{ borderTop: '1px dashed var(--hairline)', padding: '0.65rem 0' }}>
              <div className="row row--between wrap" style={{ gap: '0.5rem' }}>
                <span className="t-sm" style={{ color: 'var(--text-main)' }}>
                  {row.label}
                </span>
                <span className={`badge ${row.earned === row.points ? 'badge--green' : 'badge--amber'}`}>
                  {row.earned}/{row.points}
                </span>
              </div>
              <p className="term t-xs dim mt-1" style={{ marginBottom: 0 }}>
                {row.description}
                {row.reportPoints ? ` Report: ${row.reportEarned}/${row.reportPoints} points.` : ''}
              </p>
              {row.blockers.length > 0 ? (
                <p className="term t-xs muted mt-1" style={{ marginBottom: 0 }}>
                  Needs: {row.blockers.join('; ')}
                </p>
              ) : (
                <p className="term t-xs neon-green mt-1" style={{ marginBottom: 0 }}>
                  Complete
                </p>
              )}
            </div>
          ))}
          {(score.hintPenalty > 0 || score.scopePenalty > 0) && (
            <div style={{ borderTop: '1px dashed var(--hairline)', paddingTop: '0.65rem' }}>
              <p className="term t-xs muted" style={{ marginBottom: 0 }}>
                Adjustments: {revealedHints.size} hint{revealedHints.size === 1 ? '' : 's'} revealed
                {score.scopePenalty > 0 ? '; scope acknowledgement missing' : ''}.
              </p>
            </div>
          )}
        </div>
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

              <ChallengeEvidenceVault
                key={lab.id}
                challengeId={lab.id}
                challengeTitle={lab.title}
                defaultSource={lab.evidenceTitle}
                onOpenReport={openReport}
              />

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
                <p className="term t-xs dim mb-2">
                  Write up what you found. A persisted lab report contributes to the evidence and remediation score.
                </p>
                <button className="btn btn--primary btn--block" onClick={openReport}>
                  {hasReport ? '⎙ Edit lab report' : '⎙ Draft report'}
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
