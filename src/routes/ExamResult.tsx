import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Copy, Download } from 'lucide-react'
import type { Question } from '../types'
import { useStore } from '../store/useStore'
import { useQuestionMap } from '../store/selectors'
import { DOMAINS } from '../data/taxonomy'
import { correctChoices, isCorrect } from '../lib/grade'
import {
  buildExamStudyPlan,
  examResultToMarkdown,
  getExamModuleScores,
  getFlaggedSummary,
} from '../lib/examReport'
import { formatDate, formatDuration } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'
import { Donut } from '../components/charts/Donut'
import { StatBars } from '../components/charts/Bars'
import { Markdown } from '../components/ui/Markdown'
import { Explanation } from '../components/question/Explanation'

type ReviewFilter = 'wrong' | 'flagged' | 'low-confidence' | 'slow' | 'all'

function downloadMarkdown(markdown: string, sessionId: string) {
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mock-exam-report-${sessionId}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function iconStyle() {
  return { width: 16, height: 16 } as const
}

export function ExamResult() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const results = useStore((s) => s.examResults)
  const rescheduleReview = useStore((s) => s.rescheduleReview)
  const upsertMistake = useStore((s) => s.upsertMistake)
  const qmap = useQuestionMap()
  const [filter, setFilter] = useState<ReviewFilter>('wrong')
  const [copied, setCopied] = useState(false)
  const [actionMsg, setActionMsg] = useState('')

  const result = useMemo(
    () => results.find((r) => r.sessionId === id) ?? results[results.length - 1],
    [results, id],
  )

  const reviewItems = useMemo(() => {
    const out: {
      q: Question
      chosen: string | string[] | null
      correct: boolean
      flagged: boolean
      confidence: number | null
      timeMs: number
      slow: boolean
      lowConfidence: boolean
    }[] = []
    if (!result) return out
    const slowCutoffMs = Math.max(90_000, result.total > 0 ? (result.timeUsedSec * 1000 * 1.5) / result.total : 0)
    for (const qid of result.questionIds) {
      const q = qmap.get(qid)
      if (!q) continue
      const chosen = result.answers[qid] ?? null
      const meta = result.reviewMeta?.[qid]
      const confidence = meta?.confidence ?? null
      const timeMs = meta?.timeMs ?? 0
      out.push({
        q,
        chosen,
        correct: isCorrect(q, chosen),
        flagged: result.flagged?.[qid] === true || meta?.flagged === true,
        confidence,
        timeMs,
        slow: timeMs > 0 && timeMs >= slowCutoffMs,
        lowConfidence: typeof confidence === 'number' && confidence <= 2,
      })
    }
    return out
  }, [result, qmap])

  const resultQuestions = useMemo(() => reviewItems.map((item) => item.q), [reviewItems])
  const moduleScores = useMemo(() => (result ? getExamModuleScores(result, resultQuestions) : []), [result, resultQuestions])
  const flagged = useMemo(() => (result ? getFlaggedSummary(result, resultQuestions) : { total: 0, correct: 0, pct: -1 }), [result, resultQuestions])
  const studyPlan = useMemo(() => (result ? buildExamStudyPlan(result, resultQuestions) : []), [result, resultQuestions])
  const markdown = useMemo(() => (result ? examResultToMarkdown(result, resultQuestions) : ''), [result, resultQuestions])

  const copyMarkdown = () => {
    if (!navigator.clipboard || !markdown) return
    void navigator.clipboard.writeText(markdown).then(() => setCopied(true))
  }

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
  const flaggedItems = reviewItems.filter((r) => r.flagged)
  const lowConfidence = reviewItems.filter((r) => r.lowConfidence)
  const slow = reviewItems.filter((r) => r.slow)
  const list =
    filter === 'wrong'
      ? wrong
      : filter === 'flagged'
        ? flaggedItems
        : filter === 'low-confidence'
          ? lowConfidence
          : filter === 'slow'
            ? slow
            : reviewItems

  const enqueueShown = () => {
    const now = Date.now()
    list.forEach(({ q }) => rescheduleReview(q.id, now))
    setActionMsg(`Added ${list.length} shown item${list.length === 1 ? '' : 's'} to the review queue.`)
  }

  const sendToMistakes = (q: Question, correct: boolean) => {
    upsertMistake(q.id, {
      whyWrong: correct ? 'Flagged during mock exam review.' : 'Missed during mock exam review.',
      correctReasoning: q.explanation.why,
      trapPattern: q.explanation.trap,
      memoryPhrase: q.explanation.memory_phrase,
      nextAction: `Review M${String(q.module).padStart(2, '0')} ${q.moduleName} and retry this question.`,
    })
    setActionMsg('Sent to Mistake Notebook.')
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>Result // {result.presetLabel} · {formatDate(result.submittedAt)}</>}
        title="Exam Report"
        actions={
          <>
            <button className="btn btn--ghost btn--sm" onClick={copyMarkdown}>
              <Copy aria-hidden="true" strokeWidth={1.9} style={iconStyle()} />
              {copied ? 'Copied' : 'Copy Markdown'}
            </button>
            <button className="btn btn--primary btn--sm" onClick={() => downloadMarkdown(markdown, result.sessionId)}>
              <Download aria-hidden="true" strokeWidth={1.9} style={iconStyle()} />
              Export Markdown
            </button>
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/exam')}>
              ← Mock Exam
            </button>
          </>
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
                <span className="muted">Typical target</span>
                <span className="mono">{result.passMark}%</span>
              </div>
              <div className="row row--between t-sm">
                <span className="muted">Safety margin</span>
                <span className={`mono ${result.scorePct >= result.passMark ? 'neon-green' : 'neon-red'}`}>
                  {result.scorePct >= result.passMark ? '+' : ''}
                  {Math.round(result.scorePct - result.passMark)} pts
                </span>
              </div>
              <div className="row row--between t-sm">
                <span className="muted">Time used</span>
                <span className="mono">
                  {formatDuration(result.timeUsedSec)} / {formatDuration(result.durationSec)}
                </span>
              </div>
              <div className="row row--between t-sm">
                <span className="muted">Flagged accuracy</span>
                <span className="mono">
                  {flagged.total > 0 ? `${Math.round(flagged.pct)}% (${flagged.correct}/${flagged.total})` : 'n/a'}
                </span>
              </div>
              <div className={`badge ${result.passed ? 'badge--green' : 'badge--red'} mt-2`} style={{ fontSize: '0.82rem' }}>
                {result.passed ? '✓ Above your target' : '✕ Below your target — keep drilling'}
              </div>
            </div>
          </div>
        </Panel>

        <div className="stack">
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

          <Panel title="Module Breakdown">
            {moduleScores.length === 0 ? (
              <p className="muted t-sm">No module data.</p>
            ) : (
              <StatBars
                rows={moduleScores.map((m) => ({
                  label: `M${String(m.module).padStart(2, '0')} ${m.moduleName}`,
                  sub: `${m.correct}/${m.total}`,
                  value: m.pct / 100,
                  color: m.pct >= result.passMark ? 'var(--acid-green)' : m.pct >= 50 ? 'var(--warning-amber)' : 'var(--danger-red)',
                }))}
              />
            )}
          </Panel>
        </div>
      </div>

      <Panel title="Next 7 Days" className="mb-3">
        <div className="grid-cards">
          {studyPlan.map((item) => (
            <div key={item.day} className="neon-card">
              <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                <span className="badge badge--cyan">Day {item.day}</span>
                <span className="display t-sm" style={{ color: 'var(--text-main)' }}>{item.title}</span>
              </div>
              <p className="term t-xs dim mt-1">{item.detail}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Answer Review"
        right={
          <div className="row wrap" style={{ gap: '0.5rem' }}>
            <div className="segmented">
              <button className={filter === 'wrong' ? 'is-active' : ''} onClick={() => setFilter('wrong')}>
                Wrong ({wrong.length})
              </button>
              <button className={filter === 'flagged' ? 'is-active' : ''} onClick={() => setFilter('flagged')}>
                Flagged ({flaggedItems.length})
              </button>
              <button className={filter === 'low-confidence' ? 'is-active' : ''} onClick={() => setFilter('low-confidence')}>
                Low confidence ({lowConfidence.length})
              </button>
              <button className={filter === 'slow' ? 'is-active' : ''} onClick={() => setFilter('slow')}>
                Slow ({slow.length})
              </button>
              <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
                All ({reviewItems.length})
              </button>
            </div>
            <button className="btn btn--ghost btn--sm" onClick={enqueueShown} disabled={list.length === 0}>
              Add shown to Review
            </button>
          </div>
        }
      >
        {actionMsg && <p className="term t-xs neon-green mb-2">{actionMsg}</p>}
        {list.length === 0 ? (
          <EmptyState glyph="✓" title="Nothing to review here" hint="No incorrect answers in this exam. Clean run." />
        ) : (
          <div className="stack">
            {list.map(({ q, chosen, correct, flagged, confidence, timeMs, slow, lowConfidence }, i) => {
              const key = correctChoices(q)
              const choices = result.choiceOrder?.[q.id] ?? q.choices ?? []
              return (
                <div key={q.id} className="panel" style={{ background: 'var(--panel-inset)' }}>
                  <div className="row wrap mb-1" style={{ gap: '0.4rem' }}>
                    <span className="term t-xs dim">#{i + 1}</span>
                    <span className="badge badge--cyan">{DOMAINS[q.domain].short}</span>
                    {flagged && <span className="badge badge--amber">flagged</span>}
                    {lowConfidence && <span className="badge badge--amber">low confidence</span>}
                    {slow && <span className="badge badge--purple">{formatDuration(Math.round(timeMs / 1000))}</span>}
                    {confidence && <span className="badge badge--cyan">conf {confidence}/5</span>}
                    <span className={`badge ${correct ? 'badge--green' : 'badge--red'}`}>{correct ? 'correct' : 'incorrect'}</span>
                  </div>
                  <div className="qbody mb-2">
                    <Markdown source={q.body} />
                  </div>
                  {choices.map((c, ci) => {
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
                  <div className="row row--end mt-2">
                    <button className="btn btn--ghost btn--sm" onClick={() => sendToMistakes(q, correct)}>
                      Send to Mistakes
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
