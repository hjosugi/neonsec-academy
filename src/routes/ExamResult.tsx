import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Question } from '../types'
import { useStore } from '../store/useStore'
import { useQuestionMap } from '../store/selectors'
import { DOMAINS } from '../data/taxonomy'
import { correctChoices, isCorrect } from '../lib/grade'
import { formatDate, formatDuration } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'
import { Donut } from '../components/charts/Donut'
import { StatBars } from '../components/charts/Bars'
import { Markdown } from '../components/ui/Markdown'
import { Explanation } from '../components/question/Explanation'

export function ExamResult() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const results = useStore((s) => s.examResults)
  const qmap = useQuestionMap()
  const [filter, setFilter] = useState<'wrong' | 'all'>('wrong')

  const result = useMemo(
    () => results.find((r) => r.sessionId === id) ?? results[results.length - 1],
    [results, id],
  )

  const reviewItems = useMemo(() => {
    const out: { q: Question; chosen: string | string[] | null; correct: boolean }[] = []
    if (!result) return out
    for (const qid of result.questionIds) {
      const q = qmap.get(qid)
      if (!q) continue
      const chosen = result.answers[qid] ?? null
      out.push({ q, chosen, correct: isCorrect(q, chosen) })
    }
    return out
  }, [result, qmap])

  if (!result) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Panel>
          <EmptyState glyph="⌀" title="No result" hint="This exam result is unavailable.">
            <button className="btn btn--primary" onClick={() => navigate('/exam')}>
              ← Mock Exam
            </button>
          </EmptyState>
        </Panel>
      </div>
    )
  }

  const color = result.passed ? 'var(--acid-green)' : 'var(--danger-red)'
  const wrong = reviewItems.filter((r) => !r.correct)
  const list = filter === 'wrong' ? wrong : reviewItems

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>Result // {result.presetLabel} · {formatDate(result.submittedAt)}</>}
        title="Exam Report"
        actions={
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/exam')}>
            ← Mock Exam
          </button>
        }
      />

      <div className="grid-dash mb-3">
        <Panel brackets>
          <div className="row wrap" style={{ gap: '1.5rem', alignItems: 'center' }}>
            <Donut value={result.scorePct} color={color} sublabel={result.passed ? 'PASS' : 'FAIL'} size={160} />
            <div className="grow" style={{ minWidth: 200 }}>
              <div className="row wrap" style={{ gap: '1.4rem' }}>
                <div className="stat">
                  <div className="stat__value">{result.correct}</div>
                  <div className="stat__label">Correct</div>
                </div>
                <div className="stat">
                  <div className="stat__value">{result.total - result.correct}</div>
                  <div className="stat__label">Incorrect</div>
                </div>
                <div className="stat">
                  <div className="stat__value">{result.answered}</div>
                  <div className="stat__label">Answered</div>
                </div>
              </div>
              <div className="divider" />
              <div className="row row--between t-sm">
                <span className="muted">Pass mark</span>
                <span className="mono">{result.passMark}%</span>
              </div>
              <div className="row row--between t-sm">
                <span className="muted">Time used</span>
                <span className="mono">
                  {formatDuration(result.timeUsedSec)} / {formatDuration(result.durationSec)}
                </span>
              </div>
              <div className={`badge ${result.passed ? 'badge--green' : 'badge--red'} mt-2`} style={{ fontSize: '0.82rem' }}>
                {result.passed ? '✓ Above your target' : '✕ Below your target — keep drilling'}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Domain Breakdown">
          {result.perDomain.length === 0 ? (
            <p className="muted t-sm">No domain data.</p>
          ) : (
            <StatBars
              rows={result.perDomain.map((d) => ({
                label: DOMAINS[d.domainId].short,
                sub: `${d.correct}/${d.total}`,
                value: d.pct / 100,
                color: d.pct >= result.passMark ? 'var(--acid-green)' : d.pct >= 50 ? 'var(--warning-amber)' : 'var(--danger-red)',
              }))}
            />
          )}
        </Panel>
      </div>

      <Panel
        title="Answer Review"
        right={
          <div className="segmented">
            <button className={filter === 'wrong' ? 'is-active' : ''} onClick={() => setFilter('wrong')}>
              Wrong ({wrong.length})
            </button>
            <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
              All ({reviewItems.length})
            </button>
          </div>
        }
      >
        {list.length === 0 ? (
          <EmptyState glyph="✓" title="Nothing to review here" hint="No incorrect answers in this exam. Clean run." />
        ) : (
          <div className="stack">
            {list.map(({ q, chosen, correct }, i) => {
              const key = correctChoices(q)
              return (
                <div key={q.id} className="panel" style={{ background: 'var(--panel-inset)' }}>
                  <div className="row wrap mb-1" style={{ gap: '0.4rem' }}>
                    <span className="term t-xs dim">#{i + 1}</span>
                    <span className="badge badge--cyan">{DOMAINS[q.domain].short}</span>
                    <span className={`badge ${correct ? 'badge--green' : 'badge--red'}`}>{correct ? 'correct' : 'incorrect'}</span>
                  </div>
                  <div className="qbody mb-2">
                    <Markdown source={q.body} />
                  </div>
                  {(q.choices ?? []).map((c, ci) => {
                    const isKey = key.includes(c)
                    const isPicked = Array.isArray(chosen) ? chosen.includes(c) : chosen === c
                    const cls = ['choice']
                    if (isKey) cls.push('is-correct')
                    else if (isPicked) cls.push('is-wrong')
                    return (
                      <div key={ci} className={cls.join(' ')} style={{ cursor: 'default' }}>
                        <span className="choice__key">{String.fromCharCode(65 + ci)}</span>
                        <span className="grow">{c}</span>
                        {isKey && <span className="neon-green">✓</span>}
                        {!isKey && isPicked && <span className="neon-red">✕ your pick</span>}
                      </div>
                    )
                  })}
                  <Explanation q={q} />
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
