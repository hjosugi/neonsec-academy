import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ENGAGEMENTS } from '../data/tracks/engagement'
import type { EngagementFindingStatus, EngagementStepKey } from '../data/tracks/types'
import type { EngagementProgress, Severity } from '../types'
import { useStore } from '../store/useStore'
import {
  ENGAGEMENT_STATUSES,
  ENGAGEMENT_STEP_ORDER,
  blankEngagementProgress,
  engagementStatus,
  inventoryReview,
  triageReview,
} from '../lib/engagement'
import { reportToMarkdown } from '../lib/reportMarkdown'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const STATUS_LABEL: Record<EngagementFindingStatus, string> = {
  confirmed: 'Confirmed finding',
  'false-positive': 'False positive',
  'out-of-scope': 'Out of scope',
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

export function EngagementWorkflow() {
  const scenario = ENGAGEMENTS[0]
  const navigate = useNavigate()
  const stored = useStore((s) => s.engagementProgress[scenario.id])
  const reports = useStore((s) => s.reports)
  const evidenceItems = useStore((s) => s.evidenceItems)
  const saveEngagementProgress = useStore((s) => s.saveEngagementProgress)
  const generateEngagementReport = useStore((s) => s.generateEngagementReport)
  const resetEngagement = useStore((s) => s.resetEngagement)
  const progress: EngagementProgress = stored ?? blankEngagementProgress(scenario)
  const status = engagementStatus(scenario, progress)
  const [active, setActive] = useState<EngagementStepKey>(() => status.steps.find((step) => !step.complete)?.key ?? 'scope')
  const [checkedInventory, setCheckedInventory] = useState(false)
  const step = scenario.steps.find((item) => item.key === active)!
  const stepStatus = status.steps.find((item) => item.key === active)!
  const report = progress.reportId ? reports.find((item) => item.id === progress.reportId) : undefined
  const inventory = inventoryReview(scenario, progress)
  const triage = triageReview(scenario, progress)

  const save = (patch: Partial<EngagementProgress>) => saveEngagementProgress({ ...progress, ...patch })
  const toggleCheck = (index: number) => {
    const marks = [...(progress.checklist[active] ?? step.checklist.map(() => false))]
    marks[index] = !marks[index]
    save({ checklist: { ...progress.checklist, [active]: marks } })
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="CEH+ // Pentest Engagement Workflow"
        title={scenario.title}
        sub={scenario.summary}
        actions={<Link className="btn btn--ghost btn--sm" to="/beyond">← CEH+ Tracks</Link>}
      />

      <Panel className="mb-3" brackets>
        <div className="row row--between wrap" style={{ gap: '0.6rem' }}>
          <div>
            <div className="page__eyebrow" style={{ margin: 0 }}>{scenario.client}</div>
            <p className="term t-xs dim" style={{ marginBottom: 0 }}>
              Synthetic engagement: prepared SoW, RoE, asset list, and test notes only. Nothing is scanned or exploited.
            </p>
          </div>
          <span className={`badge ${status.complete ? 'badge--green' : 'badge--amber'}`}>
            {status.complete ? 'engagement complete' : `${status.completedSteps}/${ENGAGEMENT_STEP_ORDER.length} steps`}
          </span>
        </div>
        <div className="row wrap mt-2" style={{ gap: '0.35rem' }} role="tablist" aria-label="Engagement steps">
          {ENGAGEMENT_STEP_ORDER.map((key, index) => {
            const item = status.steps[index]
            const meta = scenario.steps.find((s) => s.key === key)!
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active === key}
                className={`chip ${active === key ? 'chip--active' : ''}`}
                style={item.complete ? { borderColor: 'var(--acid-green)' } : undefined}
                onClick={() => setActive(key)}
              >
                {item.complete ? '✓' : index + 1} {meta.title}
              </button>
            )
          })}
        </div>
      </Panel>

      <div className="grid-dash">
        <div className="stack">
          {active === 'scope' && (
            <>
              <Panel title="Statement of work (synthetic)">
                <ol className="t-sm muted" style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {scenario.statementOfWork.map((line) => <li key={line} className="mb-1">{line}</li>)}
                </ol>
              </Panel>
              <Panel title="Scope violation quiz" right={<span className="term t-xs dim">{scenario.scopeQuiz.filter((q) => progress.quizAnswers[q.id] === q.answer).length}/{scenario.scopeQuiz.length} correct</span>}>
                <div className="stack">
                  {scenario.scopeQuiz.map((item) => {
                    const chosen = progress.quizAnswers[item.id]
                    const correct = chosen === item.answer
                    return (
                      <div key={item.id}>
                        <p className="t-sm" style={{ color: 'var(--text-main)' }}>{item.prompt}</p>
                        <div className="stack stack--sm" role="radiogroup" aria-label={item.prompt}>
                          {item.options.map((option) => (
                            <button
                              key={option}
                              role="radio"
                              aria-checked={chosen === option}
                              className={`choice ${chosen === option ? (correct ? 'is-correct' : 'is-wrong') : ''}`}
                              onClick={() => save({ quizAnswers: { ...progress.quizAnswers, [item.id]: option } })}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        {chosen && (
                          <p className={`term t-xs mt-1 ${correct ? 'neon-green' : 'neon-amber'}`}>
                            {correct ? '✓ ' : 'Not quite — '}{item.explanation}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Panel>
            </>
          )}

          {active === 'roe' && (
            <Panel title="Rules of engagement (synthetic)">
              <ol className="t-sm muted" style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {scenario.rulesOfEngagement.map((line) => <li key={line} className="mb-1">{line}</li>)}
              </ol>
              <label className="toggle mt-3">
                <input type="checkbox" checked={progress.roeAcknowledged} onChange={(e) => save({ roeAcknowledged: e.target.checked })} />
                <span className="toggle__track" />
                <span className="t-sm">I have read the rules of engagement and will stop and ask before anything outside them.</span>
              </label>
            </Panel>
          )}

          {active === 'inventory' && (
            <Panel title="Asset inventory" right={<span className="term t-xs dim">{inventory.classified}/{inventory.total} classified</span>}>
              <p className="term t-xs dim">Decide whether each asset is in scope based only on the written statement of work.</p>
              <div className="scroll-x">
                <table className="table">
                  <thead><tr><th>Asset</th><th>Address</th><th>Type</th><th>Criticality</th><th>Scope decision</th></tr></thead>
                  <tbody>
                    {scenario.assets.map((asset) => {
                      const decision = progress.inventory[asset.id]
                      const wrong = checkedInventory && decision !== undefined && decision !== asset.inScope
                      return (
                        <tr key={asset.id}>
                          <td>
                            <div className="t-sm">{asset.name}</div>
                            <div className="term t-xs dim">{asset.owner}</div>
                            {checkedInventory && decision !== undefined && (
                              <div className={`term t-xs ${wrong ? 'neon-red' : 'neon-green'}`}>{wrong ? '✕ ' : '✓ '}{asset.reason}</div>
                            )}
                          </td>
                          <td><code>{asset.address}</code></td>
                          <td className="term t-xs">{asset.type}</td>
                          <td className="term t-xs">{asset.criticality}</td>
                          <td>
                            <div className="row" style={{ gap: '0.3rem' }}>
                              <button className={`btn btn--sm ${decision === true ? 'btn--green' : 'btn--ghost'}`} aria-pressed={decision === true} onClick={() => save({ inventory: { ...progress.inventory, [asset.id]: true } })}>In</button>
                              <button className={`btn btn--sm ${decision === false ? 'btn--danger' : 'btn--ghost'}`} aria-pressed={decision === false} onClick={() => save({ inventory: { ...progress.inventory, [asset.id]: false } })}>Out</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <button className="btn btn--primary btn--sm mt-2" onClick={() => setCheckedInventory(true)} disabled={inventory.classified === 0}>
                Check inventory against the SoW
              </button>
              {checkedInventory && (
                <p className={`term t-xs mt-2 ${inventory.wrong.length === 0 ? 'neon-green' : 'neon-amber'}`}>
                  {inventory.wrong.length === 0 ? 'All classified assets match the written scope.' : `${inventory.wrong.length} decision(s) conflict with the SoW.`}
                </p>
              )}
            </Panel>
          )}

          {active === 'triage' && (
            <Panel title="Finding triage" right={<span className="term t-xs dim">{triage.decided}/{triage.total} triaged</span>}>
              <div className="stack">
                {scenario.findings.map((finding) => {
                  const decision = progress.triage[finding.id]
                  const asset = scenario.assets.find((item) => item.id === finding.assetId)
                  const statusOk = decision?.status === finding.expectedStatus
                  return (
                    <div key={finding.id} className="panel" style={{ background: 'var(--panel-inset)' }}>
                      <div className="row wrap" style={{ gap: '0.35rem' }}>
                        <strong className="t-sm">{finding.title}</strong>
                        <span className="badge">{asset?.address}</span>
                      </div>
                      <p className="term t-xs dim mt-1">{finding.source}</p>
                      <p className="t-sm muted">{finding.evidence}</p>
                      <div className="row wrap" style={{ gap: '0.5rem' }}>
                        <div className="field" style={{ margin: 0, minWidth: 170 }}>
                          <label className="label" htmlFor={`eng-status-${finding.id}`}>Status</label>
                          <select
                            id={`eng-status-${finding.id}`}
                            className="select"
                            value={decision?.status ?? ''}
                            onChange={(e) => save({ triage: { ...progress.triage, [finding.id]: { status: e.target.value as EngagementFindingStatus, severity: decision?.severity ?? 'medium' } } })}
                          >
                            <option value="" disabled>Choose…</option>
                            {ENGAGEMENT_STATUSES.map((value) => <option key={value} value={value}>{STATUS_LABEL[value]}</option>)}
                          </select>
                        </div>
                        <div className="field" style={{ margin: 0, width: 130 }}>
                          <label className="label" htmlFor={`eng-sev-${finding.id}`}>Severity</label>
                          <select
                            id={`eng-sev-${finding.id}`}
                            className="select"
                            value={decision?.severity ?? 'medium'}
                            disabled={!decision}
                            onChange={(e) => decision && save({ triage: { ...progress.triage, [finding.id]: { ...decision, severity: e.target.value as Severity } } })}
                          >
                            {SEVERITIES.map((value) => <option key={value} value={value}>{value}</option>)}
                          </select>
                        </div>
                      </div>
                      {decision && (
                        <p className={`term t-xs mt-2 ${statusOk ? 'neon-green' : 'neon-amber'}`} style={{ marginBottom: 0 }}>
                          {statusOk ? '✓ ' : `Reconsider (expected ${STATUS_LABEL[finding.expectedStatus]}): `}{finding.rationale}
                          {statusOk && triage.severityGaps.includes(finding.id) ? ` Suggested severity: ${finding.expectedSeverity}.` : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Panel>
          )}

          {active === 'report' && (
            <Panel title="Report delivery">
              <p className="t-sm muted">
                Generate the Markdown report from your confirmed findings. It includes scope, methodology, severity-ordered findings,
                a remediation plan, and an appendix of the rules of engagement and closed items.
              </p>
              <div className="row wrap" style={{ gap: '0.5rem' }}>
                <button className="btn btn--primary btn--sm" disabled={triage.decided < triage.total} onClick={() => generateEngagementReport(scenario.id)}>
                  {report ? 'Regenerate report' : 'Generate report'}
                </button>
                {report && (
                  <>
                    <button className="btn btn--green btn--sm" onClick={() => download('engagement-report.md', reportToMarkdown(report, evidenceItems))}>⤓ Export Markdown</button>
                    <button className="btn btn--ghost btn--sm" onClick={() => navigate('/reports', { state: { openReportId: report.id } })}>Open in Report Builder →</button>
                  </>
                )}
              </div>
              {triage.decided < triage.total && <p className="term t-xs neon-amber mt-2">Triage every finding before generating the report.</p>}
              {report && (
                <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>
                  {report.findings.length} confirmed findings · {report.findings.map((finding) => finding.severity).join(', ')}
                </p>
              )}
            </Panel>
          )}
        </div>

        <div className="stack">
          <Panel title={step.title} right={<span className={`badge ${stepStatus.complete ? 'badge--green' : 'badge--amber'}`}>{stepStatus.complete ? 'complete' : 'in progress'}</span>}>
            <p className="t-sm muted">{step.goal}</p>
            <div className="term t-xs dim mb-1">Checklist</div>
            <div className="stack stack--sm">
              {step.checklist.map((item, index) => (
                <label key={item} className="row clickable" style={{ gap: '0.55rem', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={progress.checklist[active]?.[index] === true} onChange={() => toggleCheck(index)} style={{ marginTop: 3 }} />
                  <span className="t-sm">{item}</span>
                </label>
              ))}
            </div>
            <div className="term t-xs dim mt-3 mb-1">Deliverable</div>
            <p className="t-sm muted">{step.deliverable}</p>
            {stepStatus.scorePct !== null && <p className="term t-xs">Accuracy: {stepStatus.scorePct}%</p>}
            {stepStatus.blockers.length > 0 && (
              <ul className="term t-xs neon-amber" style={{ paddingLeft: '1.1rem', marginBottom: 0 }}>
                {stepStatus.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            )}
          </Panel>
          {status.complete && (
            <Panel title="Engagement complete">
              <p className="t-sm muted" style={{ marginTop: 0 }}>
                Scope confirmed, rules acknowledged, inventory matched, findings triaged, and report delivered.
              </p>
            </Panel>
          )}
          <button
            className="btn btn--danger btn--sm"
            onClick={() => {
              if (window.confirm('Reset this engagement? Generated reports are kept.')) {
                resetEngagement(scenario.id)
                setActive('scope')
                setCheckedInventory(false)
              }
            }}
          >
            Reset engagement
          </button>
        </div>
      </div>
    </div>
  )
}
