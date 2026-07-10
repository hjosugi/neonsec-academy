import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Finding, Report, Severity } from '../types'
import { LABS, type Lab } from '../data/labs'
import { useStore } from '../store/useStore'
import { uid } from '../lib/id'
import { formatDate } from '../lib/format'
import { EVIDENCE_TYPE_LABELS, evidenceForChallenge } from '../lib/evidence'
import { reportToMarkdown } from '../lib/reportMarkdown'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const SEV_CLASS: Record<Severity, string> = {
  critical: 'badge--red',
  high: 'badge--red',
  medium: 'badge--amber',
  low: 'badge--cyan',
  info: 'badge--purple',
}

function blankFinding(): Finding {
  return { id: uid('f-'), title: '', severity: 'medium', impact: '', remediation: '', evidence: '', evidenceIds: [] }
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function reportFromLab(lab: Lab): Report {
  const now = Date.now()
  return {
    id: uid('r-'),
    challengeId: lab.id,
    title: `Report — ${lab.title}`,
    scope: `Synthetic lab: ${lab.category}. Allowed: ${lab.scope.allowed.join('; ')}.`,
    summary: lab.brief,
    findings: lab.modelFindings.map((f) => ({ id: uid('f-'), evidence: '', evidenceIds: [], ...f })),
    createdAt: now,
    updatedAt: now,
  }
}

function reportMatchesLab(report: Report, lab: Lab): boolean {
  const title = `Report — ${lab.title}`
  const scope = `Synthetic lab: ${lab.category}. Allowed: ${lab.scope.allowed.join('; ')}.`
  return report.challengeId === lab.id || report.title === title || (report.scope === scope && report.summary === lab.brief)
}

function challengeIdForReport(report: Report | null): string | undefined {
  if (!report) return undefined
  return report.challengeId ?? LABS.find((lab) => reportMatchesLab(report, lab))?.id
}

export function Reports() {
  const location = useLocation()
  const navigate = useNavigate()
  const reports = useStore((s) => s.reports)
  const evidenceItems = useStore((s) => s.evidenceItems)
  const upsert = useStore((s) => s.upsertReport)
  const remove = useStore((s) => s.deleteReport)

  const [draft, setDraft] = useState<Report | null>(null)
  const [saved, setSaved] = useState(false)
  const seededRef = useRef(false)
  const challengeId = challengeIdForReport(draft)
  const availableEvidence = useMemo(
    () => challengeId ? evidenceForChallenge(evidenceItems, challengeId) : [...evidenceItems].sort((a, b) => b.timestamp - a.timestamp),
    [challengeId, evidenceItems],
  )

  // Open an existing lab report or seed a new one from a lab hand-off.
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    const state = location.state as { openReportId?: string; prefillLab?: Lab } | null
    const requested = state?.openReportId
      ? reports.find((report) => report.id === state.openReportId)
      : undefined
    if (requested) {
      setDraft(requested)
      setSaved(true)
    } else if (state?.prefillLab) {
      const lab = state.prefillLab
      const r = reportFromLab(lab)
      upsert(r)
      setDraft(r)
    }
    if (state?.openReportId || state?.prefillLab) {
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location.pathname, location.state, navigate, reports, upsert])

  const patch = (p: Partial<Report>) => {
    setDraft((d) => (d ? { ...d, ...p, updatedAt: Date.now() } : d))
    setSaved(false)
  }
  const patchFinding = (id: string, p: Partial<Finding>) => {
    setDraft((d) => (d ? { ...d, findings: d.findings.map((f) => (f.id === id ? { ...f, ...p } : f)), updatedAt: Date.now() } : d))
    setSaved(false)
  }

  const toggleEvidence = (finding: Finding, evidenceId: string) => {
    const current = finding.evidenceIds ?? []
    patchFinding(finding.id, {
      evidenceIds: current.includes(evidenceId)
        ? current.filter((id) => id !== evidenceId)
        : [...current, evidenceId],
    })
  }

  const save = () => {
    if (!draft) return
    const next = challengeId && !draft.challengeId ? { ...draft, challengeId } : draft
    upsert(next)
    setDraft(next)
    setSaved(true)
  }

  // ---- editor ----
  if (draft) {
    return (
      <div className="page" style={{ maxWidth: 900 }}>
        <PageHeader
          eyebrow="Practical // Report Builder"
          title="Findings Report"
          actions={
            <>
              <button className="btn btn--ghost btn--sm" onClick={() => { save(); setDraft(null) }}>
                ← All reports
              </button>
              <button className="btn btn--primary btn--sm" onClick={save}>
                {saved ? '✓ Saved' : 'Save'}
              </button>
            </>
          }
        />

        <Panel className="mb-3">
          <div className="field">
            <label className="label">Title</label>
            <input className="input" value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
          </div>
          <div className="field">
            <label className="label">Scope (synthetic)</label>
            <input className="input" value={draft.scope} onChange={(e) => patch({ scope: e.target.value })} placeholder="Synthetic dataset only…" />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Executive summary</label>
            <textarea className="textarea" value={draft.summary} onChange={(e) => patch({ summary: e.target.value })} />
          </div>
        </Panel>

        <div className="row row--between mb-2">
          <h3 className="panel__title">Findings ({draft.findings.length})</h3>
          <button className="btn btn--ghost btn--sm" onClick={() => patch({ findings: [...draft.findings, blankFinding()] })}>
            ＋ Add finding
          </button>
        </div>

        <div className="stack mb-3">
          {draft.findings.map((f, i) => (
            <Panel key={f.id}>
              <div className="row row--between mb-2" style={{ gap: '0.5rem' }}>
                <span className={`badge ${SEV_CLASS[f.severity]}`}>#{i + 1} · {f.severity}</span>
                <button className="btn btn--danger btn--sm" onClick={() => patch({ findings: draft.findings.filter((x) => x.id !== f.id) })}>
                  ✕
                </button>
              </div>
              <div className="row wrap" style={{ gap: '0.6rem' }}>
                <div className="field grow" style={{ minWidth: 200 }}>
                  <label className="label">Title</label>
                  <input className="input" value={f.title} onChange={(e) => patchFinding(f.id, { title: e.target.value })} />
                </div>
                <div className="field" style={{ width: 140 }}>
                  <label className="label">Severity</label>
                  <select className="select" value={f.severity} onChange={(e) => patchFinding(f.id, { severity: e.target.value as Severity })}>
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="label">Impact</label>
                <textarea className="textarea" style={{ minHeight: 52 }} value={f.impact} onChange={(e) => patchFinding(f.id, { impact: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Remediation</label>
                <textarea className="textarea" style={{ minHeight: 52 }} value={f.remediation} onChange={(e) => patchFinding(f.id, { remediation: e.target.value })} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Evidence note (synthetic reference)</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 52 }}
                  value={f.evidence}
                  onChange={(e) => patchFinding(f.id, { evidence: e.target.value })}
                  placeholder="Optional manual citation or reasoning note"
                />
              </div>

              <div className="field mt-3" style={{ marginBottom: 0 }}>
                <div className="row row--between wrap mb-1" style={{ gap: '0.5rem' }}>
                  <label className="label" style={{ margin: 0 }}>Evidence Vault citations</label>
                  <span className="term t-xs dim">{(f.evidenceIds ?? []).length} linked</span>
                </div>
                {availableEvidence.length === 0 ? (
                  <div className="panel" style={{ background: 'var(--panel-inset)', padding: '0.7rem 0.8rem' }}>
                    <p className="term t-xs dim" style={{ marginBottom: challengeId ? '0.5rem' : 0 }}>
                      No saved evidence is available{challengeId ? ' for this challenge' : ''}.
                    </p>
                    {challengeId && (
                      <Link className="btn btn--ghost btn--sm" to={`/labs/${encodeURIComponent(challengeId)}`}>
                        Add evidence in lab
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="stack stack--sm">
                    {availableEvidence.map((item) => {
                      const checked = (f.evidenceIds ?? []).includes(item.id)
                      const labTitle = LABS.find((lab) => lab.id === item.challengeId)?.title ?? item.challengeId
                      return (
                        <label
                          key={item.id}
                          className="row clickable"
                          style={{
                            alignItems: 'flex-start',
                            gap: '0.65rem',
                            border: `1px solid ${checked ? 'rgba(57,255,20,0.35)' : 'var(--hairline)'}`,
                            borderRadius: 'var(--r-md)',
                            background: checked ? 'rgba(57,255,20,0.05)' : 'var(--panel-inset)',
                            padding: '0.7rem 0.8rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleEvidence(f, item.id)}
                            style={{ marginTop: 3 }}
                          />
                          <span className="grow">
                            <span className="row wrap" style={{ gap: '0.35rem' }}>
                              <span className="badge badge--cyan">{EVIDENCE_TYPE_LABELS[item.type]}</span>
                              {!challengeId && <span className="badge">{labTitle}</span>}
                              <strong className="t-sm">{item.title}</strong>
                            </span>
                            <span className="term t-xs muted" style={{ display: 'block', marginTop: '0.35rem' }}>
                              {item.note}
                            </span>
                            <span className="term t-xs dim" style={{ display: 'block', marginTop: '0.25rem' }}>
                              source: {item.source}{item.reference ? ` · ref: ${item.reference}` : ''}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </Panel>
          ))}
          {draft.findings.length === 0 && <p className="muted t-sm">No findings yet — add one above.</p>}
        </div>

        <div className="row wrap" style={{ gap: '0.5rem' }}>
          <button className="btn btn--green" onClick={() => { save(); download(`${draft.title.replace(/\s+/g, '-').toLowerCase() || 'report'}.md`, reportToMarkdown(draft, evidenceItems)) }}>
            ⤓ Export Markdown
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => navigator.clipboard?.writeText(reportToMarkdown(draft, evidenceItems))}
          >
            ⧉ Copy Markdown
          </button>
          <button className="btn btn--danger" onClick={() => { remove(draft.id); setDraft(null) }}>
            Delete report
          </button>
        </div>
      </div>
    )
  }

  // ---- list ----
  const newReport = () => {
    const now = Date.now()
    setDraft({ id: uid('r-'), title: '', scope: '', summary: '', findings: [], createdAt: now, updatedAt: now })
    setSaved(false)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practical // Reports"
        title="Reports"
        sub="Practise the deliverable that actually matters on the job: clear findings with impact and remediation."
        actions={
          <button className="btn btn--primary btn--sm" onClick={newReport}>
            ＋ New report
          </button>
        }
      />

      {reports.length === 0 ? (
        <Panel>
          <EmptyState glyph="⎙" title="No reports yet" hint="Draft a report from any Safe Lab, or start a blank one. Export as Markdown when done.">
            <button className="btn btn--primary" onClick={newReport}>
              ＋ New report
            </button>
          </EmptyState>
        </Panel>
      ) : (
        <div className="stack stack--sm">
          {reports.map((r) => (
            <button key={r.id} className="neon-card" onClick={() => { setDraft(r); setSaved(true) }}>
              <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                <span className="display t-sm" style={{ color: 'var(--text-main)' }}>
                  {r.title || 'Untitled Report'}
                </span>
                <span className="term t-xs dim">{formatDate(r.updatedAt)}</span>
              </div>
              <div className="row wrap mt-1" style={{ gap: '0.3rem' }}>
                <span className="badge">{r.findings.length} findings</span>
                <span className="badge badge--cyan">
                  {r.findings.reduce((count, finding) => count + (finding.evidenceIds?.length ?? 0), 0)} vault links
                </span>
                {r.findings.slice(0, 4).map((f) => (
                  <span key={f.id} className={`badge ${SEV_CLASS[f.severity]}`}>
                    {f.severity}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
