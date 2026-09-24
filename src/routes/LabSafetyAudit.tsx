import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { LABS, type Lab, type LabSafetyAuditRecord } from '../data/labs'
import { SAFE_SAMPLE_LAB, UNSAFE_SAMPLE_LAB } from '../data/labAuditSamples'
import {
  AUDIT_RULES,
  AUDIT_RULESET_VERSION,
  OVERRIDE_NOTE_MIN_LENGTH,
  auditReportToMarkdown,
  passRecord,
  publishDecision,
  type PublishDecision,
} from '../lib/labSafetyAudit'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function DecisionFindings({ decision }: { decision: PublishDecision }) {
  if (decision.reasons.length === 0 && decision.report.findings.length === 0) {
    return <p className="term t-xs neon-green" style={{ margin: 0 }}>No findings. Stored audit record is current.</p>
  }
  return (
    <div className="stack stack--sm">
      {decision.reasons.map((reason) => (
        <p key={reason} className="term t-xs neon-red" style={{ margin: 0 }}>Gate: {reason}</p>
      ))}
      {decision.report.findings.map((finding, index) => (
        <div key={`${finding.rule}-${finding.field}-${index}`} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.6rem 0.75rem' }}>
          <div className="row wrap" style={{ gap: '0.35rem' }}>
            <span className={`badge ${finding.severity === 'blocker' ? 'badge--red' : 'badge--amber'}`}>{finding.severity}</span>
            <strong className="t-sm">{AUDIT_RULES[finding.rule].label}</strong>
            <span className="badge">{finding.field}</span>
          </div>
          <p className="term t-xs muted mt-1" style={{ marginBottom: 0 }}>
            <code>{finding.value}</code> — {finding.message}
          </p>
          <p className="term t-xs neon-green mt-1" style={{ marginBottom: 0 }}>Safe alternative: {finding.safeAlternative}</p>
        </div>
      ))}
    </div>
  )
}

export function LabSafetyAudit() {
  const decisions = useMemo(() => LABS.map(publishDecision), [])
  const [draftText, setDraftText] = useState('')
  const [reviewer, setReviewer] = useState('')
  const [overrideNote, setOverrideNote] = useState('')
  const [parseError, setParseError] = useState('')
  const [draft, setDraft] = useState<Lab | null>(null)

  const draftDecision = draft ? publishDecision(draft) : null
  const blockerRules = draftDecision
    ? [...new Set(draftDecision.report.findings.filter((finding) => finding.severity === 'blocker').map((finding) => finding.rule))]
    : []
  const overrideRecord: LabSafetyAuditRecord = {
    rulesetVersion: AUDIT_RULESET_VERSION,
    status: 'override',
    reviewedAt: today(),
    reviewer: reviewer.trim(),
    overrideNote: overrideNote.trim(),
    acceptedRules: blockerRules,
  }
  const overrideDecision = draft && blockerRules.length > 0 ? publishDecision({ ...draft, safetyAudit: overrideRecord }) : null
  const suggestedRecord = draftDecision?.report.computedStatus === 'pass' ? passRecord(today()) : overrideRecord

  const loadSample = (lab: Lab) => {
    setDraftText(JSON.stringify(lab, null, 2))
    setDraft(lab)
    setParseError('')
  }

  const runDraft = () => {
    try {
      const parsed = JSON.parse(draftText) as unknown
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Lab JSON must be an object.')
      setDraft(parsed as Lab)
      setParseError('')
    } catch (error) {
      setDraft(null)
      setParseError(error instanceof Error ? error.message : 'Invalid JSON.')
    }
  }

  const passing = decisions.filter((decision) => decision.publishable).length

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practical // Safe Labs // Safety Audit"
        title="Lab Safety Audit"
        sub={`Ruleset v${AUDIT_RULESET_VERSION}: forbidden targets and activities, public IPs, real domains and emails, credential fields, live malware references, tool commands, and payloads.`}
        actions={<Link className="btn btn--ghost btn--sm" to="/labs">← Safe Labs</Link>}
      />

      <Panel
        title="Shipped labs"
        className="mb-3"
        right={<span className={`badge ${passing === decisions.length ? 'badge--green' : 'badge--red'}`}>{passing}/{decisions.length} publishable</span>}
      >
        <p className="term t-xs dim">
          CI runs the same gate with <code>npm run audit:labs</code>; a lab without a current stored audit record, or with
          unresolved blockers, fails the build.
        </p>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr><th>Lab</th><th>Decision</th><th>Stored record</th><th>Blockers</th><th>Warnings</th></tr>
            </thead>
            <tbody>
              {decisions.map((decision) => {
                const lab = LABS.find((item) => item.id === decision.targetId)
                return (
                  <tr key={decision.targetId}>
                    <td><Link to={`/labs/${decision.targetId}`}>{decision.report.title}</Link></td>
                    <td><span className={`badge ${decision.publishable ? 'badge--green' : 'badge--red'}`}>{decision.publishable ? decision.status : 'rejected'}</span></td>
                    <td className="term t-xs dim">{lab?.safetyAudit ? `${lab.safetyAudit.status} · v${lab.safetyAudit.rulesetVersion} · ${lab.safetyAudit.reviewedAt}` : 'missing'}</td>
                    <td className="tabnum">{decision.report.blockers}</td>
                    <td className="tabnum">{decision.report.warnings}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <button className="btn btn--ghost btn--sm mt-2" onClick={() => navigator.clipboard?.writeText(auditReportToMarkdown(decisions))}>
          ⧉ Copy audit report (Markdown)
        </button>
      </Panel>

      <Panel title="Audit a draft lab" className="mb-3">
        <p className="term t-xs dim">
          Paste a lab definition as JSON to run the audit and publish gate locally. Nothing is uploaded or added to the lab list.
        </p>
        <div className="row wrap mb-2" style={{ gap: '0.4rem' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => loadSample(SAFE_SAMPLE_LAB)}>Load safe sample</button>
          <button className="btn btn--ghost btn--sm" onClick={() => loadSample(UNSAFE_SAMPLE_LAB)}>Load unsafe sample</button>
        </div>
        <textarea
          className="textarea"
          aria-label="Draft lab JSON"
          style={{ minHeight: 160, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          spellCheck={false}
        />
        <button className="btn btn--primary btn--sm mt-2" onClick={runDraft} disabled={!draftText.trim()}>Run audit</button>
        {parseError && <p className="term t-xs neon-red mt-2" role="alert">{parseError}</p>}
      </Panel>

      {draftDecision && (
        <Panel
          title={`Audit report — ${draftDecision.report.title}`}
          className="mb-3"
          right={<span className={`badge ${draftDecision.publishable ? 'badge--green' : 'badge--red'}`}>{draftDecision.publishable ? 'publishable' : 'rejected'}</span>}
        >
          <DecisionFindings decision={draftDecision} />

          {blockerRules.length > 0 && (
            <div className="panel mt-3" style={{ background: 'var(--panel-inset)' }}>
              <div className="panel__title">Manual override (safety review required)</div>
              <p className="term t-xs dim">
                Overrides are for false positives only. They need a named reviewer and a note of at least {OVERRIDE_NOTE_MIN_LENGTH} characters
                explaining why every flagged item is safe. Accepted rules: {blockerRules.join(', ')}.
              </p>
              <div className="row wrap" style={{ gap: '0.5rem' }}>
                <div className="field grow" style={{ minWidth: 180 }}>
                  <label className="label" htmlFor="audit-reviewer">Safety reviewer</label>
                  <input id="audit-reviewer" className="input" value={reviewer} onChange={(event) => setReviewer(event.target.value)} />
                </div>
              </div>
              <div className="field">
                <label className="label" htmlFor="audit-note">Safety review note</label>
                <textarea id="audit-note" className="textarea" value={overrideNote} onChange={(event) => setOverrideNote(event.target.value)} />
              </div>
              {overrideDecision && (
                <p className={`term t-xs ${overrideDecision.publishable ? 'neon-amber' : 'neon-red'}`} style={{ margin: 0 }}>
                  {overrideDecision.publishable ? 'With this override the lab would publish as status "override".' : `Override not accepted: ${overrideDecision.reasons.join(' ')}`}
                </p>
              )}
            </div>
          )}

          <div className="mt-3">
            <div className="term t-xs dim mb-1">Audit record to store in the lab's <code>safetyAudit</code> metadata</div>
            <pre style={{ background: 'var(--bg-abyss)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '0.7rem', fontSize: '0.78rem', overflowX: 'auto' }}>
              <code>{JSON.stringify(suggestedRecord, null, 2)}</code>
            </pre>
          </div>
        </Panel>
      )}
    </div>
  )
}
