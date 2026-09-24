import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { FindingStatus, Severity, TriageFinding } from '../types'
import { LABS } from '../data/labs'
import { useStore } from '../store/useStore'
import {
  FINDING_STATUSES,
  IMPACT_LABELS,
  IMPACT_RATINGS,
  LIKELIHOODS,
  LIKELIHOOD_LABELS,
  NOTE_REQUIRED,
  SEVERITIES,
  STATUS_FLOW,
  STATUS_LABELS,
  blankTriageFinding,
  effectiveSeverity,
  fixPriority,
  riskScore,
  rubricSeverity,
  severityDeviation,
  summarizeTriage,
  validateTriageFinding,
} from '../lib/triage'
import { formatDateTime } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const SEV_CLASS: Record<Severity, string> = {
  critical: 'badge--red',
  high: 'badge--red',
  medium: 'badge--amber',
  low: 'badge--cyan',
  info: 'badge--purple',
}

const STATUS_CLASS: Record<FindingStatus, string> = {
  open: 'badge--amber',
  confirmed: 'badge--red',
  'false-positive': 'badge--purple',
  'accepted-risk': 'badge--cyan',
  fixed: 'badge--green',
}

function TriageEditor({ initial, onClose }: { initial: TriageFinding; onClose: () => void }) {
  const navigate = useNavigate()
  const reports = useStore((s) => s.reports)
  const upsertTriageFinding = useStore((s) => s.upsertTriageFinding)
  const deleteTriageFinding = useStore((s) => s.deleteTriageFinding)
  const setTriageStatus = useStore((s) => s.setTriageStatus)
  const addTriageToReport = useStore((s) => s.addTriageToReport)
  const stored = useStore((s) => s.triageFindings.find((item) => item.id === initial.id))
  const [draft, setDraft] = useState<TriageFinding>(stored ?? initial)
  const [statusNote, setStatusNote] = useState('')
  const [targetReport, setTargetReport] = useState<string>(reports[0]?.id ?? 'new')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const current = stored ?? draft
  const severity = effectiveSeverity(draft)
  const rubric = rubricSeverity(draft.impactRating, draft.likelihood)
  const deviation = severityDeviation(draft)
  const priority = fixPriority({ severity, status: current.status })

  const patch = (p: Partial<TriageFinding>) => {
    setDraft((d) => ({ ...d, ...p }))
    setMessage('')
  }

  const save = (): boolean => {
    const next = { ...draft, status: current.status, statusNote: current.statusNote, history: current.history }
    const result = validateTriageFinding(next)
    setErrors(result.errors)
    if (!result.ok) return false
    upsertTriageFinding(next)
    setMessage('Finding saved.')
    return true
  }

  const changeStatus = (to: FindingStatus) => {
    if (!stored && !save()) return
    if (NOTE_REQUIRED.includes(to) && !statusNote.trim()) {
      setErrors([`${STATUS_LABELS[to]} needs a justification note.`])
      return
    }
    if (setTriageStatus(draft.id, to, statusNote)) {
      setStatusNote('')
      setErrors([])
      setMessage(`Status changed to ${STATUS_LABELS[to]}.`)
    } else {
      setErrors([`Cannot move from ${STATUS_LABELS[current.status]} to ${STATUS_LABELS[to]}.`])
    }
  }

  const addToReport = () => {
    if (!save()) return
    const reportId = addTriageToReport(draft.id, targetReport === 'new' ? null : targetReport)
    if (reportId) {
      setTargetReport(reportId)
      setMessage('Finding added to the report.')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 920 }}>
      <PageHeader
        eyebrow="Practical // Vulnerability Triage"
        title={draft.title || 'New finding'}
        actions={
          <>
            <button className="btn btn--ghost btn--sm" onClick={onClose}>← Triage board</button>
            <button className="btn btn--primary btn--sm" onClick={save}>Save</button>
          </>
        }
      />

      <Panel className="mb-3">
        <div className="row wrap" style={{ gap: '0.4rem' }}>
          <span className={`badge ${SEV_CLASS[severity]}`}>{severity}</span>
          <span className={`badge ${STATUS_CLASS[current.status]}`}>{STATUS_LABELS[current.status]}</span>
          <span className="badge">risk {riskScore(draft.impactRating, draft.likelihood)}/16</span>
          <span className={`badge ${priority === 'P1' || priority === 'P2' ? 'badge--red' : 'badge--cyan'}`}>
            fix {priority === 'none' ? 'not required' : priority}
          </span>
        </div>
        <div className="row wrap mt-2" style={{ gap: '0.6rem' }}>
          <div className="field grow" style={{ minWidth: 220 }}>
            <label className="label" htmlFor="triage-title">Title</label>
            <input id="triage-title" className="input" value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
          </div>
          <div className="field grow" style={{ minWidth: 220 }}>
            <label className="label" htmlFor="triage-asset">Affected asset (synthetic)</label>
            <input
              id="triage-asset"
              className="input"
              value={draft.asset}
              placeholder="e.g. api.neoncorp.example /invoices"
              onChange={(e) => patch({ asset: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="triage-evidence">Evidence</label>
          <textarea id="triage-evidence" className="textarea" style={{ minHeight: 60 }} value={draft.evidence} onChange={(e) => patch({ evidence: e.target.value })} />
        </div>
        <div className="field">
          <label className="label" htmlFor="triage-impact">Impact</label>
          <textarea id="triage-impact" className="textarea" style={{ minHeight: 52 }} value={draft.impact} onChange={(e) => patch({ impact: e.target.value })} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="label" htmlFor="triage-remediation">Remediation</label>
          <textarea id="triage-remediation" className="textarea" style={{ minHeight: 52 }} value={draft.remediation} onChange={(e) => patch({ remediation: e.target.value })} />
        </div>
      </Panel>

      <Panel title="Severity rubric" className="mb-3">
        <div className="row wrap" style={{ gap: '0.6rem' }}>
          <div className="field grow" style={{ minWidth: 220 }}>
            <label className="label" htmlFor="triage-impact-rating">Impact rating</label>
            <select id="triage-impact-rating" className="select" value={draft.impactRating} onChange={(e) => patch({ impactRating: e.target.value as TriageFinding['impactRating'] })}>
              {IMPACT_RATINGS.map((value) => <option key={value} value={value}>{IMPACT_LABELS[value]}</option>)}
            </select>
          </div>
          <div className="field grow" style={{ minWidth: 220 }}>
            <label className="label" htmlFor="triage-likelihood">Likelihood</label>
            <select id="triage-likelihood" className="select" value={draft.likelihood} onChange={(e) => patch({ likelihood: e.target.value as TriageFinding['likelihood'] })}>
              {LIKELIHOODS.map((value) => <option key={value} value={value}>{LIKELIHOOD_LABELS[value]}</option>)}
            </select>
          </div>
        </div>
        <div className="row wrap" style={{ gap: '0.8rem', alignItems: 'flex-end' }}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={draft.severityMode === 'manual'}
              onChange={(e) => patch({ severityMode: e.target.checked ? 'manual' : 'rubric', severity: e.target.checked ? draft.severity : rubric })}
            />
            <span className="toggle__track" />
            <span className="t-sm">Override severity manually</span>
          </label>
          {draft.severityMode === 'manual' && (
            <div className="field" style={{ margin: 0, width: 150 }}>
              <label className="label" htmlFor="triage-severity">Manual severity</label>
              <select id="triage-severity" className="select" value={draft.severity} onChange={(e) => patch({ severity: e.target.value as Severity })}>
                {SEVERITIES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
          )}
        </div>
        <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>
          Rubric: impact × likelihood = {riskScore(draft.impactRating, draft.likelihood)} → <strong>{rubric}</strong>.
          {draft.severityMode === 'manual' && Math.abs(deviation) >= 2 && (
            <span className="neon-amber"> Manual severity is {Math.abs(deviation)} levels from the rubric — record why in the evidence or status note.</span>
          )}
        </p>
      </Panel>

      <Panel title="Status flow" className="mb-3">
        <p className="term t-xs dim">
          {FINDING_STATUSES.map((status) => STATUS_LABELS[status]).join(' → ')} · allowed next:{' '}
          {STATUS_FLOW[current.status].map((status) => STATUS_LABELS[status]).join(', ')}
        </p>
        <div className="field">
          <label className="label" htmlFor="triage-status-note">
            Status note {NOTE_REQUIRED.some((status) => STATUS_FLOW[current.status].includes(status)) ? '(required for false positive, accepted risk, fixed)' : ''}
          </label>
          <input
            id="triage-status-note"
            className="input"
            value={statusNote}
            placeholder="Why the status changes: verification, risk owner, compensating control…"
            onChange={(e) => setStatusNote(e.target.value)}
          />
        </div>
        <div className="row wrap" style={{ gap: '0.4rem' }}>
          {STATUS_FLOW[current.status].map((status) => (
            <button key={status} className="btn btn--ghost btn--sm" type="button" onClick={() => changeStatus(status)}>
              → {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        {current.history.length > 0 && (
          <div className="stack stack--sm mt-3">
            {[...current.history].reverse().map((entry) => (
              <div key={`${entry.at}-${entry.to}`} className="term t-xs muted">
                {formatDateTime(entry.at)} · {STATUS_LABELS[entry.from]} → {STATUS_LABELS[entry.to]}
                {entry.note ? ` — ${entry.note}` : ''}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Report hand-off" className="mb-3">
        <div className="row wrap" style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
          <div className="field grow" style={{ margin: 0, minWidth: 220 }}>
            <label className="label" htmlFor="triage-report">Target report</label>
            <select id="triage-report" className="select" value={targetReport} onChange={(e) => setTargetReport(e.target.value)}>
              <option value="new">＋ New triage report</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>{report.title || 'Untitled report'}</option>
              ))}
            </select>
          </div>
          <button className="btn btn--primary btn--sm" type="button" onClick={addToReport}>Add to report</button>
          {targetReport !== 'new' && (
            <button className="btn btn--ghost btn--sm" type="button" onClick={() => navigate('/reports', { state: { openReportId: targetReport } })}>
              Open report →
            </button>
          )}
        </div>
        <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>
          Adding again refreshes the same report finding instead of duplicating it. Asset, likelihood, and status are included in Markdown export.
        </p>
      </Panel>

      {errors.length > 0 && (
        <div className="mb-2" role="alert">
          {errors.map((error) => <p key={error} className="term t-xs neon-red" style={{ margin: 0 }}>{error}</p>)}
        </div>
      )}
      {message && <p className="term t-xs neon-green mb-2" role="status">{message}</p>}
      <button
        className="btn btn--danger btn--sm"
        type="button"
        onClick={() => {
          if (window.confirm('Delete this triage finding? Report copies are kept.')) {
            deleteTriageFinding(draft.id)
            onClose()
          }
        }}
      >
        Delete finding
      </button>
    </div>
  )
}

export function Triage() {
  const findings = useStore((s) => s.triageFindings)
  const importLabFindingsToTriage = useStore((s) => s.importLabFindingsToTriage)
  const [editing, setEditing] = useState<TriageFinding | null>(null)
  const [labId, setLabId] = useState(LABS[0]?.id ?? '')
  const [statusFilter, setStatusFilter] = useState<FindingStatus | 'all'>('all')
  const [notice, setNotice] = useState('')
  const summary = useMemo(() => summarizeTriage(findings), [findings])
  const visible = statusFilter === 'all' ? findings : findings.filter((finding) => finding.status === statusFilter)

  if (editing) return <TriageEditor key={editing.id} initial={editing} onClose={() => setEditing(null)} />

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practical // Vulnerability Triage"
        title="Triage Board"
        sub="Go beyond the flag: rate impact and likelihood, set severity and status, and prioritise fixes before reporting."
        actions={<button className="btn btn--primary btn--sm" onClick={() => setEditing(blankTriageFinding())}>＋ New finding</button>}
      />

      <div className="grid-3 mb-3">
        <Panel>
          <div className="stat__value">{summary.total}</div>
          <div className="stat__label">Findings</div>
        </Panel>
        <Panel>
          <div className="stat__value">{summary.fixQueue.length}</div>
          <div className="stat__label">In fix queue (open + confirmed)</div>
        </Panel>
        <Panel>
          <div className="row wrap" style={{ gap: '0.3rem' }}>
            {SEVERITIES.map((severity) => (
              <span key={severity} className={`badge ${SEV_CLASS[severity]}`}>{severity} {summary.bySeverity[severity]}</span>
            ))}
          </div>
          <div className="stat__label mt-1">By effective severity</div>
        </Panel>
      </div>

      <Panel className="mb-3" title="Import from a Safe Lab">
        <div className="row wrap" style={{ gap: '0.5rem', alignItems: 'flex-end' }}>
          <div className="field grow" style={{ margin: 0, minWidth: 220 }}>
            <label className="label" htmlFor="triage-lab">Lab</label>
            <select id="triage-lab" className="select" value={labId} onChange={(e) => setLabId(e.target.value)}>
              {LABS.map((lab) => <option key={lab.id} value={lab.id}>{lab.title}</option>)}
            </select>
          </div>
          <button
            className="btn btn--ghost btn--sm"
            type="button"
            onClick={() => {
              const added = importLabFindingsToTriage(labId)
              setNotice(added > 0 ? `${added} model finding${added === 1 ? '' : 's'} imported as open triage items.` : 'Those lab findings are already on the board.')
            }}
          >
            Import model findings
          </button>
        </div>
        {notice && <p className="term t-xs neon-green mt-2" style={{ marginBottom: 0 }} role="status">{notice}</p>}
      </Panel>

      <div className="row wrap mb-2" style={{ gap: '0.3rem' }}>
        {(['all', ...FINDING_STATUSES] as const).map((status) => (
          <button
            key={status}
            className={`chip ${statusFilter === status ? "chip--active" : ""}`}
            onClick={() => setStatusFilter(status)}
            aria-pressed={statusFilter === status}
          >
            {status === 'all' ? `All ${summary.total}` : `${STATUS_LABELS[status]} ${summary.byStatus[status]}`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Panel>
          <EmptyState glyph="⚖" title="No findings here" hint="Create a finding or import a lab's model findings, then triage severity and status.">
            <button className="btn btn--primary" onClick={() => setEditing(blankTriageFinding())}>＋ New finding</button>
          </EmptyState>
        </Panel>
      ) : (
        <div className="stack stack--sm">
          {visible.map((finding) => {
            const severity = effectiveSeverity(finding)
            const priority = fixPriority({ severity, status: finding.status })
            return (
              <button key={finding.id} className="neon-card" onClick={() => setEditing(finding)}>
                <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                  <span className="display t-sm" style={{ color: 'var(--text-main)' }}>{finding.title}</span>
                  <span className="term t-xs dim">{formatDateTime(finding.updatedAt)}</span>
                </div>
                <div className="row wrap mt-1" style={{ gap: '0.3rem' }}>
                  <span className={`badge ${SEV_CLASS[severity]}`}>{severity}{finding.severityMode === 'manual' ? ' (manual)' : ''}</span>
                  <span className={`badge ${STATUS_CLASS[finding.status]}`}>{STATUS_LABELS[finding.status]}</span>
                  <span className="badge">{priority === 'none' ? 'no fix needed' : priority}</span>
                  {finding.asset && <span className="badge badge--purple">{finding.asset}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
