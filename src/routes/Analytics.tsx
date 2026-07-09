import { useNavigate } from 'react-router-dom'
import { useDomainStats, useModuleStats, useOverview, useReadiness } from '../store/selectors'
import { DOMAINS } from '../data/taxonomy'
import { pct } from '../lib/format'
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

export function Analytics() {
  const navigate = useNavigate()
  const mods = useModuleStats()
  const domains = useDomainStats()
  const ov = useOverview()
  const readiness = useReadiness()

  const radarPoints = domains.map((d) => ({ label: d.domainName, value: Math.max(0.02, d.mastery) }))
  const started = domains.some((d) => d.attempts > 0)

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
          </div>
        </Panel>
      </div>

      <Panel title="Module Matrix" right={<span className="term t-xs dim">click a row to drill</span>}>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Domain</th>
                <th style={{ width: 180 }}>Mastery</th>
                <th>Accuracy</th>
                <th>Confidence</th>
                <th>Trend</th>
                <th>Seen</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {mods.map((m) => (
                <tr key={m.module} className="clickable" onClick={() => navigate(`/practice?module=${m.module}`)}>
                  <td>
                    <span className="badge badge--cyan" style={{ marginRight: '0.4rem' }}>
                      M{String(m.module).padStart(2, '0')}
                    </span>
                    <span className="t-sm">{m.moduleName}</span>
                  </td>
                  <td className="term t-xs dim">{DOMAINS[m.domain].short}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
