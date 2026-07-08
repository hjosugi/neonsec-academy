import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  useDueQueue,
  useModuleStats,
  useOverview,
  useRank,
  useReadiness,
} from '../store/selectors'
import { weakestModules } from '../lib/analytics'
import { pct } from '../lib/format'
import { BADGES, DOMAINS } from '../data/taxonomy'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Meter } from '../components/ui/Meter'
import { Donut } from '../components/charts/Donut'
import { Sparkline, StatBars } from '../components/charts/Bars'

const BAND = {
  green: { c: 'var(--acid-green)', label: 'Exam Ready' },
  amber: { c: 'var(--warning-amber)', label: 'Getting Close' },
  red: { c: 'var(--danger-red)', label: 'Keep Training' },
}

function StatTile({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="panel" style={{ padding: '0.9rem 1rem' }}>
      <div className="stat">
        <div className="stat__value" style={{ color: accent }}>
          {value}
        </div>
        <div className="stat__label">{label}</div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const ov = useOverview()
  const readiness = useReadiness()
  const mods = useModuleStats()
  const due = useDueQueue()
  const { rank } = useRank()
  const results = useStore((s) => s.examResults)
  const streak = useStore((s) => s.profile.streakDays)
  const badges = useStore((s) => s.profile.badges)

  const weak = useMemo(() => weakestModules(mods, 5), [mods])
  const mockScores = useMemo(
    () => results.slice(-8).map((r) => Math.round(r.scorePct)),
    [results],
  )
  const band = BAND[readiness.band]

  return (
    <div className="page">
      <PageHeader
        eyebrow="Neon Tokyo-7 // Trainee Console"
        title={
          <>
            Dashboard <span className="badge badge--cyan">{rank.title}</span>
          </>
        }
        sub="Your mission: pass the CEH. Drill the bank, clear your reviews, and push readiness into the green."
      />

      <div className="grid-4 mb-3 rise-list">
        <StatTile value={`${ov.attemptedUnique}/${ov.totalQuestions}`} label="Questions seen" />
        <StatTile
          value={ov.overallAccuracy < 0 ? '—' : pct(ov.overallAccuracy)}
          label="Overall accuracy"
          accent={ov.overallAccuracy >= 0.7 ? 'var(--acid-green)' : undefined}
        />
        <StatTile value={`${streak}d`} label="Study streak" accent={streak > 0 ? 'var(--neon-magenta)' : undefined} />
        <StatTile
          value={`${ov.dueToday}`}
          label="Reviews due"
          accent={ov.dueToday > 0 ? 'var(--warning-amber)' : undefined}
        />
      </div>

      <div className="grid-dash">
        <div className="stack">
          {/* Readiness */}
          <Panel title="Exam Readiness" brackets right={<Link to="/analytics" className="btn btn--ghost btn--sm">Details →</Link>}>
            <div className="row wrap" style={{ gap: '1.4rem', alignItems: 'center' }}>
              <Donut value={readiness.score} color={band.c} sublabel={band.label} size={150} />
              <div className="grow" style={{ minWidth: 220 }}>
                <div className="stack stack--sm">
                  {readiness.factors.map((f) => (
                    <div key={f.name} className="row" style={{ gap: '0.7rem' }} title={f.hint}>
                      <div className="term t-xs" style={{ width: 92, color: 'var(--text-muted)' }}>
                        {f.name}
                      </div>
                      <div className="grow">
                        <Meter value={f.value} color={band.c} />
                      </div>
                      <div className="term t-xs dim tabnum" style={{ width: 34, textAlign: 'right' }}>
                        {Math.round(f.value)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row row--between mt-2 wrap" style={{ gap: '0.5rem' }}>
                  {mockScores.length > 0 ? (
                    <div className="row" style={{ gap: '0.6rem' }}>
                      <Sparkline values={mockScores} color={band.c} />
                      <span className="term t-xs dim">last {mockScores.length} mocks</span>
                    </div>
                  ) : (
                    <span className="term t-xs dim">No mock exams yet</span>
                  )}
                  <button className="btn btn--primary btn--sm" onClick={() => navigate('/exam')}>
                    Start mock exam →
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          {/* Weak areas */}
          <Panel
            title="Weakest Modules"
            right={
              <button className="btn btn--magenta btn--sm" onClick={() => navigate('/practice?mode=weak')}>
                Drill weak →
              </button>
            }
          >
            {weak.length === 0 ? (
              <p className="muted t-sm">Start answering questions to map your weak spots.</p>
            ) : (
              <StatBars
                rows={weak.map((m) => ({
                  label: m.moduleName,
                  sub: `${DOMAINS[m.domain].short} · ${m.attempts === 0 ? 'not started' : `${m.attempts} attempts`}`,
                  value: m.attempts === 0 ? -1 : m.mastery,
                  color: 'var(--neon-magenta)',
                  onClick: () => navigate(`/practice?module=${m.module}`),
                }))}
              />
            )}
          </Panel>
        </div>

        <div className="stack">
          {/* Today review */}
          <Panel title="Today's Review" brackets>
            {due.length > 0 ? (
              <>
                <div className="row" style={{ gap: '0.8rem', alignItems: 'baseline' }}>
                  <div className="stat__value neon-amber">{due.length}</div>
                  <div className="muted t-sm">cards scheduled for today</div>
                </div>
                <p className="term t-xs dim mt-1">
                  Spaced repetition keeps what you have learned from fading. Clear these first.
                </p>
                <button className="btn btn--primary btn--block mt-2" onClick={() => navigate('/review')}>
                  ↻ Start review
                </button>
              </>
            ) : (
              <div className="center" style={{ padding: '0.6rem 0' }}>
                <div style={{ fontSize: '2rem' }} className="neon-green">
                  ✓
                </div>
                <div className="display t-sm">Queue clear</div>
                <p className="term t-xs dim mt-1">Nothing due. Learn something new in Practice.</p>
                <button className="btn btn--ghost btn--sm btn--block mt-2" onClick={() => navigate('/practice')}>
                  ✦ Practice new
                </button>
              </div>
            )}
          </Panel>

          {/* Quick actions */}
          <Panel title="Quick Access">
            <div className="stack stack--sm">
              <Link to="/practice" className="btn btn--ghost btn--block">
                ✦ Practice by module
              </Link>
              <Link to="/bank" className="btn btn--ghost btn--block">
                ▤ Browse question bank
              </Link>
              <Link to="/map" className="btn btn--ghost btn--block">
                ⬡ Explore the city
              </Link>
            </div>
          </Panel>

          {/* Achievements */}
          <Panel title="Achievements" right={<span className="term t-xs dim">{badges.length}/{BADGES.length}</span>}>
            <div className="row wrap" style={{ gap: '0.4rem' }}>
              {BADGES.map((b) => {
                const earned = badges.includes(b.id)
                return (
                  <span
                    key={b.id}
                    className={`badge ${earned ? 'badge--cyan' : ''}`}
                    title={`${b.name} — ${b.desc}`}
                    style={{ opacity: earned ? 1 : 0.35 }}
                  >
                    {b.glyph} <span className="hide-sm">{earned ? b.name : '???'}</span>
                  </span>
                )
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
