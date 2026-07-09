import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DomainId, ExamSession } from '../types'
import { useStore } from '../store/useStore'
import { useActiveQuestions, useDomainStats } from '../store/selectors'
import { EXAM } from '../data/taxonomy'
import type { ExamPreset } from '../data/taxonomy'
import { buildExamQuestionIds } from '../lib/exam'
import { isGradable } from '../lib/grade'
import { uid } from '../lib/id'
import { formatDate, formatDuration } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Sparkline } from '../components/charts/Bars'

export function Exam() {
  const navigate = useNavigate()
  const questions = useActiveQuestions()
  const domains = useDomainStats()
  const activeExam = useStore((s) => s.activeExam)
  const startExam = useStore((s) => s.startExam)
  const results = useStore((s) => s.examResults)
  const target = useStore((s) => s.profile.examTargetPct)
  const updateProfile = useStore((s) => s.updateProfile)

  const gradableCount = useMemo(
    () => questions.filter((q) => q.module >= 1 && q.module <= 20 && isGradable(q)).length,
    [questions],
  )

  const weakWeights = useMemo(() => {
    const w: Partial<Record<DomainId, number>> = {}
    for (const d of domains) w[d.domainId] = Math.max(0.05, 1 - Math.max(0, d.mastery))
    return w
  }, [domains])

  const begin = (preset: ExamPreset) => {
    const weights = preset.id === 'weak' ? weakWeights : undefined
    const ids = buildExamQuestionIds(preset, questions, weights)
    if (ids.length === 0) return
    const now = Date.now()
    const session: ExamSession = {
      id: uid('ex-'),
      createdAt: now,
      preset: preset.id,
      presetLabel: preset.label,
      questionIds: ids,
      answers: {},
      durationSec: preset.minutes * 60,
      startedAt: now,
      endedAt: null,
      currentIndex: 0,
      status: 'in-progress',
    }
    startExam(session)
    navigate('/exam/run')
  }

  const history = useMemo(() => results.slice().sort((a, b) => b.submittedAt - a.submittedAt), [results])
  const scores = useMemo(() => results.slice(-10).map((r) => Math.round(r.scorePct)), [results])

  return (
    <div className="page">
      <PageHeader
        eyebrow="Certify // Mock Exam"
        title="Mock Exam"
        sub="CEH knowledge-exam simulation: 125 questions, 4 hours, domain-weighted to the official blueprint."
      />

      <Panel className="mb-3 mobile-only" style={{ borderColor: 'rgba(255,204,0,0.42)' }}>
        <div className="panel__title" style={{ color: 'var(--warning-amber)' }}>
          <span style={{ background: 'var(--warning-amber)', boxShadow: 'var(--glow-amber)' }} /> Desktop recommended
        </div>
        <p className="term t-xs dim mt-1">
          Review and Quick Sim work on mobile. Full-length timed mocks are easier to manage on a desktop-sized screen.
        </p>
      </Panel>

      {activeExam && (
        <Panel className="mb-3" brackets>
          <div className="row row--between wrap" style={{ gap: '0.6rem' }}>
            <div>
              <div className="page__eyebrow" style={{ margin: 0 }}>
                Exam in progress
              </div>
              <div className="muted t-sm">
                {activeExam.presetLabel} · {activeExam.questionIds.length} questions
              </div>
            </div>
            <div className="row" style={{ gap: '0.5rem' }}>
              <button className="btn btn--ghost btn--sm" onClick={() => useStore.getState().cancelExam()}>
                Discard
              </button>
              <button className="btn btn--primary" onClick={() => navigate('/exam/run')}>
                Resume →
              </button>
            </div>
          </div>
        </Panel>
      )}

      <div className="grid-2 mb-3">
        {EXAM.presets.map((p) => (
          <Panel key={p.id}>
            <div className="row row--between">
              <h3 className="display" style={{ fontSize: '1.05rem' }}>
                {p.label}
              </h3>
              <span className="badge badge--cyan">{p.count}Q</span>
            </div>
            <p className="muted t-sm mt-1" style={{ minHeight: '2.6em' }}>
              {p.desc}
            </p>
            <div className="row row--between mt-2">
              <span className="term t-xs dim">⏱ {formatDuration(p.minutes * 60)}</span>
              <button className="btn btn--primary btn--sm" onClick={() => begin(p)} disabled={!!activeExam || gradableCount === 0}>
                Start →
              </button>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid-dash">
        <Panel title="Exam History">
          {history.length === 0 ? (
            <p className="muted t-sm">No mock exams yet. Your first one sets your baseline readiness.</p>
          ) : (
            <>
              <div className="desktop-only scroll-x">
                <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Time</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {history.map((r) => (
                    <tr key={r.sessionId}>
                      <td className="term t-sm">{formatDate(r.submittedAt)}</td>
                      <td className="t-sm">{r.presetLabel}</td>
                      <td className="mono tabnum">{Math.round(r.scorePct)}%</td>
                      <td>
                        <span className={`badge ${r.passed ? 'badge--green' : 'badge--red'}`}>{r.passed ? 'PASS' : 'FAIL'}</span>
                      </td>
                      <td className="term t-sm dim">{formatDuration(r.timeUsedSec)}</td>
                      <td>
                        <button className="btn btn--ghost btn--sm" onClick={() => navigate(`/exam/result/${r.sessionId}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
              <div className="mobile-card-list">
                {history.map((r) => (
                  <button key={r.sessionId} className="neon-card" onClick={() => navigate(`/exam/result/${r.sessionId}`)}>
                    <div className="row row--between wrap" style={{ gap: '0.35rem' }}>
                      <span className="display t-sm" style={{ color: 'var(--text-main)' }}>{r.presetLabel}</span>
                      <span className={`badge ${r.passed ? 'badge--green' : 'badge--red'}`}>{r.passed ? 'PASS' : 'FAIL'}</span>
                    </div>
                    <div className="row wrap mt-1" style={{ gap: '0.45rem' }}>
                      <span className="term t-xs dim">{formatDate(r.submittedAt)}</span>
                      <span className="mono tabnum">{Math.round(r.scorePct)}%</span>
                      <span className="term t-xs dim">{formatDuration(r.timeUsedSec)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </Panel>

        <div className="stack">
          <Panel title="Trend">
            {scores.length > 0 ? (
              <div className="center">
                <Sparkline values={scores} width={220} height={60} />
                <div className="term t-xs dim mt-1">last {scores.length} mocks</div>
              </div>
            ) : (
              <p className="term t-xs dim">Scores will chart here.</p>
            )}
          </Panel>
          <Panel title="Pass Target">
            <div className="row row--between">
              <span className="muted t-sm">Target score</span>
              <span className="neon-cyan display">{target}%</span>
            </div>
            <input
              type="range"
              min={65}
              max={95}
              step={5}
              value={target}
              onChange={(e) => updateProfile({ examTargetPct: Number(e.target.value) })}
              style={{ width: '100%', marginTop: '0.5rem' }}
            />
            <p className="term t-xs dim">Bank has {gradableCount} auto-gradable CEH questions.</p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
