import { useEffect, useMemo, useState } from 'react'
import { Copy, Download } from 'lucide-react'
import type { FinalGateCriteria } from '../lib/finalGate'
import {
  FINAL_GATE_DEFAULTS,
  evaluateFinalGate,
  finalGateToMarkdown,
  normalizeFinalGateCriteria,
} from '../lib/finalGate'
import { useStore } from '../store/useStore'
import { useModuleStats, useOverview } from '../store/selectors'
import { formatDate } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

const STORAGE_KEY = 'neonsec-academy:final-gate:v1'

function readStoredCriteria(profileTarget: number): FinalGateCriteria {
  const defaults = normalizeFinalGateCriteria({ ...FINAL_GATE_DEFAULTS, mockScorePct: profileTarget })
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaults
    return normalizeFinalGateCriteria({ ...defaults, ...JSON.parse(raw) })
  } catch {
    return defaults
  }
}

function writeStoredCriteria(criteria: FinalGateCriteria) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria))
  } catch {
    // The gate still works if private-mode storage is unavailable.
  }
}

function downloadMarkdown(markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ceh-final-gate-checklist.md'
  a.click()
  URL.revokeObjectURL(url)
}

function iconStyle() {
  return { width: 16, height: 16 } as const
}

export function FinalGate() {
  const profileTarget = useStore((s) => s.profile.examTargetPct)
  const results = useStore((s) => s.examResults)
  const modules = useModuleStats()
  const overview = useOverview()
  const [criteria, setCriteria] = useState(() => readStoredCriteria(profileTarget))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    writeStoredCriteria(criteria)
  }, [criteria])

  const report = useMemo(
    () =>
      evaluateFinalGate({
        results,
        modules,
        dueBacklog: overview.dueToday,
        criteria,
      }),
    [criteria, modules, overview.dueToday, results],
  )

  const markdown = useMemo(() => finalGateToMarkdown(report), [report])
  const passedChecks = report.checks.filter((c) => c.passed).length
  const badgeClass = report.passed ? 'badge--green' : 'badge--red'

  const patchCriteria = (patch: Partial<FinalGateCriteria>) => {
    setCriteria((current) => normalizeFinalGateCriteria({ ...current, ...patch }))
    setCopied(false)
  }

  const copyMarkdown = () => {
    if (!navigator.clipboard) return
    void navigator.clipboard.writeText(markdown).then(() => setCopied(true))
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Certify // Final Gate"
        title="CEH Final Gate"
        sub="One pre-booking checklist that combines mock streak, review backlog, module weakness, and missing local coverage."
        actions={
          <>
            <button className="btn btn--ghost btn--sm" onClick={copyMarkdown}>
              <Copy aria-hidden="true" strokeWidth={1.9} style={iconStyle()} />
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => downloadMarkdown(markdown)}>
              <Download aria-hidden="true" strokeWidth={1.9} style={iconStyle()} />
              Export Markdown
            </button>
          </>
        }
      />

      <div className="grid-dash mb-3">
        <Panel brackets>
          <div className="row row--between wrap" style={{ gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <span className={`badge ${badgeClass}`}>{report.passed ? 'PASS' : 'FAIL'}</span>
              <h2 className="display mt-1">{report.passed ? 'Ready to book' : 'Hold booking'}</h2>
              <p className="muted t-sm mt-1">
                {passedChecks}/{report.checks.length} checks passing. Generated {formatDate(report.generatedAt)}.
              </p>
            </div>
            <div className="row wrap" style={{ gap: '1.2rem' }}>
              <div className="stat">
                <div className="stat__value">{report.recentMocks.length}</div>
                <div className="stat__label">Recent mocks</div>
              </div>
              <div className="stat">
                <div className="stat__value">{overview.dueToday}</div>
                <div className="stat__label">Due backlog</div>
              </div>
              <div className="stat">
                <div className="stat__value">{report.weakModules.length}</div>
                <div className="stat__label">Weak modules</div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Gate Criteria">
          <div className="grid-2">
            <div className="field">
              <label className="label">Consecutive mocks</label>
              <input
                className="input"
                type="number"
                min={1}
                max={5}
                value={criteria.requiredMockCount}
                onChange={(e) => patchCriteria({ requiredMockCount: Number(e.currentTarget.value) })}
              />
            </div>
            <div className="field">
              <label className="label">Mock target (%)</label>
              <input
                className="input"
                type="number"
                min={50}
                max={100}
                value={criteria.mockScorePct}
                onChange={(e) => patchCriteria({ mockScorePct: Number(e.currentTarget.value) })}
              />
            </div>
            <div className="field">
              <label className="label">Max due backlog</label>
              <input
                className="input"
                type="number"
                min={0}
                max={500}
                value={criteria.maxDueBacklog}
                onChange={(e) => patchCriteria({ maxDueBacklog: Number(e.currentTarget.value) })}
              />
            </div>
            <div className="field">
              <label className="label">Weak below (%)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={criteria.weakModuleMasteryPct}
                onChange={(e) => patchCriteria({ weakModuleMasteryPct: Number(e.currentTarget.value) })}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Allowed weak modules</label>
              <input
                className="input"
                type="number"
                min={0}
                max={20}
                value={criteria.maxWeakModules}
                onChange={(e) => patchCriteria({ maxWeakModules: Number(e.currentTarget.value) })}
              />
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Checklist" className="mb-3">
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Check</th>
                <th>Actual</th>
                <th>Target</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {report.checks.map((check) => (
                <tr key={check.id}>
                  <td>
                    <span className={`badge ${check.passed ? 'badge--green' : 'badge--red'}`}>
                      {check.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </td>
                  <td>
                    <div className="t-sm">{check.label}</div>
                    <div className="term t-xs dim">{check.detail}</div>
                  </td>
                  <td className="term t-sm">{check.actual}</td>
                  <td className="t-sm">{check.target}</td>
                  <td className="t-sm">{check.nextAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid-dash">
        <Panel title="Next Actions">
          {report.nextActions.length === 0 ? (
            <p className="muted t-sm">No blocking actions. The configured final gate is passing.</p>
          ) : (
            <ol className="stack stack--sm" style={{ paddingLeft: '1.3rem' }}>
              {report.nextActions.map((action) => (
                <li key={action} className="t-sm">
                  {action}
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Module Warnings">
          {report.warnings.length === 0 ? (
            <p className="muted t-sm">No missing or unanswered CEH modules.</p>
          ) : (
            <div className="stack stack--sm">
              {report.warnings.map((w) => (
                <div key={`${w.reason}-${w.module}`} className="row row--between wrap" style={{ gap: '0.5rem' }}>
                  <span className="t-sm">
                    M{String(w.module).padStart(2, '0')} {w.moduleName}
                  </span>
                  <span className={`badge ${w.reason === 'missing' ? 'badge--red' : 'badge--amber'}`}>{w.reason}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
