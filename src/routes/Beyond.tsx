import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { TrackKey } from '../types'
import { useStore } from '../store/useStore'
import { useActiveQuestions } from '../store/selectors'
import { TRACKS } from '../data/taxonomy'
import { LABS } from '../data/labs'
import { pct } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Meter } from '../components/ui/Meter'

const TRACK_VIS: Record<TrackKey, { glyph: string; color: string }> = {
  pentest: { glyph: '⌖', color: '#00f5ff' },
  appsec: { glyph: '⧉', color: '#39ff14' },
  cloud: { glyph: '⛁', color: '#00b4d8' },
  soc: { glyph: '☰', color: '#9d4edd' },
  ir: { glyph: '⚠', color: '#ffcc00' },
  'threat-model': { glyph: '❖', color: '#ff3366' },
}

const TRACK_LABS: Record<TrackKey, string[]> = {
  pentest: ['web-idor', 'net-cleartext'],
  appsec: ['web-idor'],
  cloud: ['cloud-iam'],
  soc: ['soc-bruteforce', 'phish-headers'],
  ir: ['soc-bruteforce'],
  'threat-model': ['threat-model'],
}

export function Beyond() {
  const navigate = useNavigate()
  const questions = useActiveQuestions()
  const attempts = useStore((s) => s.attempts)
  const reportCount = useStore((s) => s.reports.length)

  const stats = useMemo(() => {
    const lastCorrect = new Map<string, boolean>()
    for (const a of attempts) lastCorrect.set(a.questionId, a.correct)
    return (Object.keys(TRACKS) as TrackKey[]).map((key) => {
      const qs = questions.filter((q) => q.module === 0 && q.track === key)
      const attempted = qs.filter((q) => lastCorrect.has(q.id))
      const correct = attempted.filter((q) => lastCorrect.get(q.id)).length
      return {
        key,
        total: qs.length,
        attempted: attempted.length,
        accuracy: attempted.length ? correct / attempted.length : -1,
        coverage: qs.length ? attempted.length / qs.length : 0,
      }
    })
  }, [questions, attempts])

  const totalBeyond = stats.reduce((s, t) => s + t.total, 0)
  const attemptedBeyond = stats.reduce((s, t) => s + t.attempted, 0)

  return (
    <div className="page">
      <PageHeader
        eyebrow="Beyond CEH // Practical Tracks"
        title="Beyond District"
        sub="The CEH gets you certified — these tracks build the job. Judgment-based questions and safe labs for real engagements: pentest, AppSec, cloud, SOC, IR, and threat modeling."
      />

      <Panel className="mb-3" brackets>
        <div className="row row--between wrap" style={{ gap: '1rem' }}>
          <div>
            <div className="page__eyebrow" style={{ margin: 0 }}>
              Practical readiness
            </div>
            <p className="muted t-sm mt-1" style={{ maxWidth: '60ch' }}>
              Work each track's questions and labs, then turn your lab findings into exported reports —
              that's your <span className="neon-cyan">portfolio evidence</span> for interviews.
            </p>
          </div>
          <div className="row" style={{ gap: '1.4rem' }}>
            <div className="stat">
              <div className="stat__value">{attemptedBeyond}/{totalBeyond}</div>
              <div className="stat__label">CEH+ seen</div>
            </div>
            <div className="stat">
              <div className="stat__value" style={{ color: reportCount ? 'var(--acid-green)' : undefined }}>
                {reportCount}
              </div>
              <div className="stat__label">Reports</div>
            </div>
          </div>
        </div>
        <div className="row wrap mt-2" style={{ gap: '0.5rem' }}>
          <Link to="/reports" className="btn btn--ghost btn--sm">
            ▣ Build portfolio report
          </Link>
          <Link to="/labs" className="btn btn--ghost btn--sm">
            ⬢ All safe labs
          </Link>
        </div>
      </Panel>

      <div className="grid-cards">
        {stats.map((t) => {
          const meta = TRACKS[t.key]
          const vis = TRACK_VIS[t.key]
          const labs = TRACK_LABS[t.key].map((id) => LABS.find((l) => l.id === id)).filter(Boolean) as typeof LABS
          return (
            <Panel key={t.key} style={{ borderTop: `2px solid ${vis.color}` }}>
              <div className="row row--between">
                <span style={{ fontSize: '1.6rem', color: vis.color }}>{vis.glyph}</span>
                <span className="badge" style={{ borderColor: vis.color, color: vis.color }}>
                  {t.total} Q
                </span>
              </div>
              <h3 className="display mt-1" style={{ fontSize: '1rem' }}>
                {meta.name}
              </h3>
              <p className="term t-xs dim mt-1" style={{ minHeight: '2.4em', lineHeight: 1.5 }}>
                {meta.blurb}
              </p>

              <div className="row row--between t-xs term mt-2">
                <span className="dim">coverage</span>
                <span className="tabnum">{t.attempted}/{t.total}</span>
              </div>
              <Meter value={t.coverage * 100} color={vis.color} />
              <div className="row row--between t-xs term mt-1">
                <span className="dim">accuracy</span>
                <span className="tabnum" style={{ color: t.accuracy < 0 ? 'var(--text-dim)' : 'var(--text-main)' }}>
                  {t.accuracy < 0 ? '—' : pct(t.accuracy)}
                </span>
              </div>

              {labs.length > 0 && (
                <div className="row wrap mt-2" style={{ gap: '0.3rem' }}>
                  {labs.map((l) => (
                    <Link key={l.id} to={`/labs/${l.id}`} className="chip" title={l.title}>
                      ⬢ {l.category}
                    </Link>
                  ))}
                </div>
              )}

              <button
                className="btn btn--primary btn--sm btn--block mt-2"
                disabled={t.total === 0}
                onClick={() => navigate(`/practice?track=${t.key}`)}
              >
                Drill track →
              </button>
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
