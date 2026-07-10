import { useNavigate } from 'react-router-dom'
import type { DrillResult, ModuleStat } from '../types'
import { useStore } from '../store/useStore'
import { useDomainStats, useModuleStats, useOverview, useReadiness } from '../store/selectors'
import { DOMAINS } from '../data/taxonomy'
import { formatDateTime, pct } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Meter } from '../components/ui/Meter'
import { RadarChart } from '../components/charts/RadarChart'
import { StatBars } from '../components/charts/Bars'

const BAND = { green: 'var(--acid-green)', amber: 'var(--warning-amber)', red: 'var(--danger-red)' }

function confidenceLabel(value: number): string {
  return value < 0 ? '-' : `${value.toFixed(1)}/5`
}

function trendLabel(trend: string): string {
  switch (trend) {
    case 'up':
      return 'improving'
    case 'down':
      return 'slipping'
    case 'flat':
      return 'flat'
    default:
      return 'insufficient data'
  }
}

function moduleCoveragePct(m: ModuleStat): number {
  return m.total > 0 ? Math.round((m.seen / m.total) * 100) : 0
}

function moduleStatusBadges(m: ModuleStat, coverageTargetPct: number, minQuestionCount: number) {
  if (m.total === 0) return [{ label: 'missing', cls: 'badge--red' }]
  const badges: Array<{ label: string; cls: string }> = []
  if (m.total < minQuestionCount) badges.push({ label: 'low inventory', cls: 'badge--amber' })
  if (m.attempts === 0) badges.push({ label: 'unanswered', cls: 'badge--amber' })
  else {
    if (moduleCoveragePct(m) < coverageTargetPct) badges.push({ label: 'low coverage', cls: 'badge--amber' })
    if (m.mastery < 0.6) badges.push({ label: 'weak', cls: 'badge--red' })
  }
  return badges.length ? badges : [{ label: 'ready', cls: 'badge--green' }]
}

function drillLabel(result: DrillResult): string {
  const f = result.filters
  const parts = [
    f.source === 'weak'
      ? 'Weak modules'
      : f.source === 'module'
        ? `M${String(f.module ?? 0).padStart(2, '0')}`
        : f.source === 'track'
          ? 'CEH+ track'
          : f.source === 'bookmarked'
            ? 'Pinned'
            : 'All bank',
  ]
  if (f.tag) parts.push(`#${f.tag}`)
  if (f.type !== 'any') parts.push(f.type)
  if (f.difficulty !== 'any') parts.push(f.difficulty)
  return parts.join(' · ')
}

export function Analytics() {
  const navigate = useNavigate()
  const mods = useModuleStats()
  const domains = useDomainStats()
  const ov = useOverview()
  const readiness = useReadiness()
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)
  const drillResults = useStore((s) => s.drillResults)
  const coverageTargetPct = settings.coverageThresholdPct ?? 80
  const minQuestionCount = settings.minModuleQuestionCount ?? 10

  const radarPoints = domains.map((d) => ({ label: d.domainName, value: Math.max(0.02, d.mastery) }))
  const started = domains.some((d) => d.attempts > 0)
  const warningCount = mods.filter((m) =>
    moduleStatusBadges(m, coverageTargetPct, minQuestionCount).some((badge) => badge.label !== 'ready'),
  ).length

  return (
    <div className="page">
      <PageHeader
        eyebrow="Master // Weakness Matrix"
        title="Analytics"
        sub="Where you are strong, where you leak points. Click any module to drill it."
      />

      <div className="grid-4 mb-3 rise-list">
        <div className="panel" style={{ padding: '0.9rem 1rem' }}>
          <div className="stat">
            <div className="stat__value">{pct(ov.coverage)}</div>
            <div className="stat__label">Bank coverage</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '0.9rem 1rem' }}>
          <div className="stat">
            <div className="stat__value">{ov.overallAccuracy < 0 ? '—' : pct(ov.overallAccuracy)}</div>
            <div className="stat__label">Accuracy</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '0.9rem 1rem' }}>
          <div className="stat">
            <div className="stat__value" style={{ color: BAND[readiness.band] }}>
              {readiness.score}
            </div>
            <div className="stat__label">Readiness</div>
          </div>
        </div>
        <div className="panel" style={{ padding: '0.9rem 1rem' }}>
          <div className="stat">
            <div className="stat__value" style={{ color: ov.weakModuleCount > 0 ? 'var(--warning-amber)' : undefined }}>
              {ov.weakModuleCount}
            </div>
            <div className="stat__label">Weak modules</div>
          </div>
        </div>
      </div>

      <div className="grid-dash mb-3">
        <Panel title="Domain Mastery Radar">
          {started ? (
            <div className="row wrap" style={{ gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <RadarChart points={radarPoints} color={BAND[readiness.band]} />
              <div className="grow" style={{ minWidth: 240 }}>
                <StatBars
                  rows={domains.map((d) => ({
                    label: d.domainName,
                    sub: `weight ${d.weightPct}% · ${d.attempts} attempts`,
                    value: d.attempts === 0 ? -1 : d.mastery,
                    color: BAND[readiness.band],
                  }))}
                />
              </div>
            </div>
          ) : (
            <p className="muted">Answer questions across the modules to light up your mastery radar.</p>
          )}
        </Panel>

        <Panel title="Readiness Factors">
          <div className="stack stack--sm">
            {readiness.factors.map((f) => (
              <div key={f.name} title={f.hint}>
                <div className="row row--between t-sm">
                  <span className="muted">{f.name}</span>
                  <span className="mono tabnum">{Math.round(f.value)}</span>
                </div>
                <Meter value={f.value} color={BAND[readiness.band]} />
                <div className="term t-xs dim">weight {f.weightPct}%</div>
              </div>
            ))}
            <div className="divider" />
            {readiness.gates.map((gate) => (
              <div key={gate.id}>
                <div className="row row--between t-sm">
                  <span className="muted">{gate.label}</span>
                  <span className={`badge ${gate.passed ? 'badge--green' : 'badge--amber'}`}>
                    {gate.passed ? 'pass' : 'next'}
                  </span>
                </div>
                <div className="term t-xs dim">{gate.detail}</div>
              </div>
            ))}
            {readiness.nextActions.length > 0 && (
              <div className="mt-1">
                <div className="term t-xs dim">Next actions</div>
                <ul className="term t-xs" style={{ margin: '0.35rem 0 0 1rem', color: 'var(--warning-amber)' }}>
                  {readiness.nextActions.slice(0, 3).map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel
        title="Coverage Thresholds"
        className="mb-3"
        right={<span className="term t-xs dim">{warningCount} module warnings</span>}
      >
        <div className="grid-2">
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Coverage target (%)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={100}
              value={coverageTargetPct}
              onChange={(e) => updateSettings({ coverageThresholdPct: Number(e.currentTarget.value) })}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Minimum questions per module</label>
            <input
              className="input"
              type="number"
              min={0}
              max={50}
              value={minQuestionCount}
              onChange={(e) => updateSettings({ minModuleQuestionCount: Number(e.currentTarget.value) })}
            />
          </div>
        </div>
      </Panel>

      <Panel
        title="Drill Results"
        className="mb-3"
        right={
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/practice?mode=weak&count=10')}>
            Weak drill →
          </button>
        }
      >
        {drillResults.length === 0 ? (
          <p className="muted t-sm">No drill results yet. Run a weak module drill to feed the matrix.</p>
        ) : (
          <div className="stack stack--sm">
            {drillResults.slice(0, 5).map((result) => (
              <div key={result.id} className="row row--between wrap" style={{ gap: '0.75rem', padding: '0.45rem 0' }}>
                <div>
                  <div className="term t-sm">{drillLabel(result)}</div>
                  <div className="term t-xs dim">{formatDateTime(result.completedAt)} · {result.total} questions</div>
                </div>
                <span className={`badge ${result.accuracyPct >= 70 ? 'badge--green' : 'badge--amber'}`}>
                  {result.accuracyPct}% · {result.correct}/{result.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Module Matrix" right={<span className="term t-xs dim">click a row to drill</span>}>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Domain</th>
                <th>Status</th>
                <th>Coverage</th>
                <th style={{ width: 180 }}>Mastery</th>
                <th>Accuracy</th>
                <th>Confidence</th>
                <th>Trend</th>
                <th>Seen</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {mods.map((m) => {
                const badges = moduleStatusBadges(m, coverageTargetPct, minQuestionCount)
                const coverage = moduleCoveragePct(m)
                return (
                  <tr key={m.module} className="clickable" onClick={() => navigate(`/practice?module=${m.module}`)}>
                    <td>
                      <span className="badge badge--cyan" style={{ marginRight: '0.4rem' }}>
                        M{String(m.module).padStart(2, '0')}
                      </span>
                      <span className="t-sm">{m.moduleName}</span>
                    </td>
                    <td className="term t-xs dim">{DOMAINS[m.domain].short}</td>
                    <td>
                      <div className="row wrap" style={{ gap: '0.3rem' }}>
                        {badges.map((badge) => (
                          <span key={badge.label} className={`badge ${badge.cls}`}>
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="mono tabnum t-sm">{m.total === 0 ? '—' : `${coverage}%`}</td>
                    <td>
                      <div className="row" style={{ gap: '0.5rem' }}>
                        <Meter value={m.attempts === 0 ? 0 : m.mastery * 100} color={m.mastery >= 0.6 ? 'var(--acid-green)' : 'var(--neon-magenta)'} />
                        <span className="term t-xs tabnum" style={{ width: 30 }}>
                          {m.attempts === 0 ? '—' : Math.round(m.mastery * 100)}
                        </span>
                      </div>
                    </td>
                    <td className="mono tabnum t-sm">{m.accuracy < 0 ? '—' : `${Math.round(m.accuracy * 100)}%`}</td>
                    <td className="mono tabnum t-sm">{confidenceLabel(m.avgConfidence)}</td>
                    <td className="term t-xs dim">{trendLabel(m.recentTrend)}</td>
                    <td className="term t-sm dim">
                      {m.seen}/{m.total}
                    </td>
                    <td className={m.dueCount > 0 ? 'neon-amber' : 'dim'}>{m.dueCount || '·'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
