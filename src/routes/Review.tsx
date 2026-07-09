import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Question, ReviewSessionSummary } from '../types'
import { useDueQueue, useQuestionMap } from '../store/selectors'
import { useStore } from '../store/useStore'
import { formatDateTime, formatDuration } from '../lib/format'
import { uid } from '../lib/id'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'
import { QuestionRunner } from '../components/question/QuestionRunner'

const REVIEW_SESSION_KEY = 'neonsec:review-session:v1'

interface SavedReviewSession {
  queue: string[]
  idx: number
  correct: number
  reasoningGaps: number
  missedIds: string[]
  masteredIds: string[]
  createdAt: number
}

function readSavedReviewSession(): SavedReviewSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(REVIEW_SESSION_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<SavedReviewSession>
    if (!Array.isArray(data.queue) || typeof data.idx !== 'number' || typeof data.correct !== 'number') return null
    return {
      queue: data.queue.filter((id): id is string => typeof id === 'string'),
      idx: Math.max(0, data.idx),
      correct: Math.max(0, data.correct),
      reasoningGaps: typeof data.reasoningGaps === 'number' ? Math.max(0, data.reasoningGaps) : 0,
      missedIds: Array.isArray(data.missedIds) ? data.missedIds.filter((id): id is string => typeof id === 'string') : [],
      masteredIds: Array.isArray(data.masteredIds) ? data.masteredIds.filter((id): id is string => typeof id === 'string') : [],
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    }
  } catch {
    return null
  }
}

function saveReviewSession(session: SavedReviewSession) {
  window.localStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(session))
}

function clearReviewSession() {
  window.localStorage.removeItem(REVIEW_SESSION_KEY)
}

function needsMistakeNotes(note?: {
  whyWrong: string
  correctReasoning: string
  memoryPhrase: string
  nextAction: string
}): boolean {
  if (!note) return true
  return [note.whyWrong, note.correctReasoning, note.memoryPhrase, note.nextAction].some((value) => value.trim() === '')
}

function weakModulesFromMisses(missedIds: string[], qmap: Map<string, Question>): ReviewSessionSummary['weakModules'] {
  const counts = new Map<number, { module: number; moduleName: string; missed: number }>()
  for (const id of missedIds) {
    const q = qmap.get(id)
    if (!q) continue
    const existing = counts.get(q.module)
    if (existing) existing.missed++
    else counts.set(q.module, { module: q.module, moduleName: q.moduleName, missed: 1 })
  }
  return [...counts.values()].sort((a, b) => b.missed - a.missed || a.module - b.module).slice(0, 3)
}

function buildNextActions(input: {
  missed: number
  incompleteNotes: number
  weakModules: ReviewSessionSummary['weakModules']
  reasoningGaps: number
}): string[] {
  const actions: string[] = []
  if (input.incompleteNotes > 0) actions.push(`Complete ${input.incompleteNotes} Mistake Notebook note${input.incompleteNotes === 1 ? '' : 's'}.`)
  if (input.weakModules.length > 0) {
    const first = input.weakModules[0]
    actions.push(`Drill ${first.module === 0 ? 'CEH+' : `M${String(first.module).padStart(2, '0')}`} · ${first.moduleName}.`)
  }
  if (input.reasoningGaps > 0) actions.push(`Review ${input.reasoningGaps} reasoning gap note${input.reasoningGaps === 1 ? '' : 's'}.`)
  if (actions.length === 0 && input.missed === 0) actions.push('Start a short weak-module drill to keep recall fresh.')
  if (actions.length === 0) actions.push('Run another focused review after updating missed cards.')
  return actions.slice(0, 3)
}

function ReviewHistory({ summaries }: { summaries: ReviewSessionSummary[] }) {
  if (summaries.length === 0) return null
  return (
    <Panel title="Recent Review Summaries">
      <div className="stack stack--sm">
        {summaries.slice(0, 5).map((summary) => (
          <div key={summary.id} className="panel" style={{ padding: '0.65rem 0.75rem' }}>
            <div className="row row--between wrap" style={{ gap: '0.5rem' }}>
              <span className="term t-xs dim">{formatDateTime(summary.completedAt)}</span>
              <span className="badge badge--cyan">{summary.accuracyPct}%</span>
            </div>
            <div className="term t-xs dim mt-1">
              {summary.correct}/{summary.total} recall · {formatDuration(Math.round(summary.timeMs / 1000))} · {summary.newMistakes} new mistakes
            </div>
            {summary.nextActions[0] && <div className="t-sm mt-1">{summary.nextActions[0]}</div>}
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function Review() {
  const navigate = useNavigate()
  const dueNow = useDueQueue()
  const qmap = useQuestionMap()
  const reviewDailyLimit = useStore((s) => s.settings.reviewDailyLimit ?? 20)
  const mistakes = useStore((s) => s.mistakes)
  const reviewSummaries = useStore((s) => s.reviewSummaries)
  const saveReviewSummary = useStore((s) => s.saveReviewSummary)
  const saved = readSavedReviewSession()
  const maxSessionSize = Math.max(0, dueNow.length)
  const [sessionSize, setSessionSize] = useState(() => Math.min(maxSessionSize || reviewDailyLimit, reviewDailyLimit))

  // freeze the queue at session start so grading doesn't reshuffle mid-run
  const [started, setStarted] = useState(() => !!saved?.queue.length)
  const [queue, setQueue] = useState<string[]>(() => saved?.queue ?? [])
  const [idx, setIdx] = useState(() => saved?.idx ?? 0)
  const [correct, setCorrect] = useState(() => saved?.correct ?? 0)
  const [reasoningGaps, setReasoningGaps] = useState(() => saved?.reasoningGaps ?? 0)
  const [missedIds, setMissedIds] = useState<string[]>(() => saved?.missedIds ?? [])
  const [masteredIds, setMasteredIds] = useState<string[]>(() => saved?.masteredIds ?? [])
  const [sessionCreatedAt, setSessionCreatedAt] = useState(() => saved?.createdAt ?? Date.now())
  const [completedAt, setCompletedAt] = useState<number | null>(null)
  const [summarySaved, setSummarySaved] = useState(false)

  const total = queue.length
  const done = started && total > 0 && idx >= total
  const weakModules = useMemo(() => weakModulesFromMisses(missedIds, qmap), [missedIds, qmap])
  const incompleteMistakeNotes = useMemo(
    () => missedIds.filter((id) => needsMistakeNotes(mistakes[id])).length,
    [missedIds, mistakes],
  )
  const nextActions = useMemo(
    () =>
      buildNextActions({
        missed: missedIds.length,
        incompleteNotes: incompleteMistakeNotes,
        weakModules,
        reasoningGaps,
      }),
    [missedIds.length, incompleteMistakeNotes, weakModules, reasoningGaps],
  )

  useEffect(() => {
    if (!started || total === 0 || idx >= total) return
    saveReviewSession({
      queue,
      idx,
      correct,
      reasoningGaps,
      missedIds,
      masteredIds,
      createdAt: sessionCreatedAt,
    })
  }, [started, queue, idx, correct, reasoningGaps, missedIds, masteredIds, total, sessionCreatedAt])

  useEffect(() => {
    if (started && total > 0 && idx >= total) clearReviewSession()
  }, [started, idx, total])

  useEffect(() => {
    if (done && completedAt === null) setCompletedAt(Date.now())
  }, [done, completedAt])

  useEffect(() => {
    if (!done || completedAt === null || summarySaved) return
    const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0
    saveReviewSummary({
      id: uid('rs-'),
      createdAt: sessionCreatedAt,
      completedAt,
      questionIds: queue,
      total,
      correct,
      accuracyPct,
      timeMs: Math.max(0, completedAt - sessionCreatedAt),
      newMistakes: missedIds.length,
      masteredItems: masteredIds.length,
      reasoningGaps,
      weakModules,
      incompleteMistakeNotes,
      nextActions,
    })
    setSummarySaved(true)
  }, [
    done,
    completedAt,
    summarySaved,
    saveReviewSummary,
    sessionCreatedAt,
    queue,
    total,
    correct,
    missedIds.length,
    masteredIds.length,
    reasoningGaps,
    weakModules,
    incompleteMistakeNotes,
    nextActions,
  ])

  const startSession = () => {
    const nextQueue = dueNow.slice(0, Math.max(1, sessionSize)).map((e) => e.question.id)
    setQueue(nextQueue)
    setIdx(0)
    setCorrect(0)
    setReasoningGaps(0)
    setMissedIds([])
    setMasteredIds([])
    const createdAt = Date.now()
    setSessionCreatedAt(createdAt)
    setCompletedAt(null)
    setSummarySaved(false)
    setStarted(true)
    saveReviewSession({ queue: nextQueue, idx: 0, correct: 0, reasoningGaps: 0, missedIds: [], masteredIds: [], createdAt })
  }

  const resetSavedSession = () => {
    clearReviewSession()
    setQueue([])
    setIdx(0)
    setCorrect(0)
    setReasoningGaps(0)
    setMissedIds([])
    setMasteredIds([])
    setCompletedAt(null)
    setSummarySaved(false)
    setStarted(false)
  }

  const onNext = (ok: boolean, reasoningGap?: string) => {
    const questionId = queue[idx]
    if (ok) setCorrect((c) => c + 1)
    if (questionId) {
      if (ok) setMasteredIds((ids) => (ids.includes(questionId) ? ids : [...ids, questionId]))
      else setMissedIds((ids) => (ids.includes(questionId) ? ids : [...ids, questionId]))
    }
    if (reasoningGap?.trim()) setReasoningGaps((count) => count + 1)
    setIdx((i) => i + 1)
  }

  if (!started) {
    if (maxSessionSize === 0) {
      return (
        <div className="page" style={{ maxWidth: 720 }}>
          <PageHeader eyebrow="Retention // Spaced Repetition" title="Review Queue" />
          <Panel>
            <EmptyState glyph="✓" title="Queue clear" hint="No cards are due right now. Spaced repetition will resurface tricky questions as their intervals mature.">
              <div className="row center" style={{ justifyContent: 'center', gap: '0.5rem' }}>
                <Link to="/practice" className="btn btn--primary">
                  ✦ Learn something new
                </Link>
                <Link to="/" className="btn btn--ghost">
                  ◈ Dashboard
                </Link>
              </div>
            </EmptyState>
          </Panel>
          <div className="mt-3">
            <ReviewHistory summaries={reviewSummaries} />
          </div>
        </div>
      )
    }

    const options = [10, 20, 30, reviewDailyLimit, maxSessionSize]
      .filter((value, index, arr) => value > 0 && value <= maxSessionSize && arr.indexOf(value) === index)
      .sort((a, b) => a - b)
    const effectiveOptions = options.length > 0 ? options : [maxSessionSize]

    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <PageHeader eyebrow="Retention // Spaced Repetition" title="Daily Review" />
        <Panel brackets pad="lg">
          <div className="stack">
            <div>
              <div className="stat__value neon-cyan">{maxSessionSize}</div>
              <p className="muted">due cards available now · daily cap {reviewDailyLimit}</p>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="label">Session size · {sessionSize}</label>
              <select className="select" value={sessionSize} onChange={(e) => setSessionSize(Number(e.target.value))}>
                {effectiveOptions.map((value) => (
                  <option key={value} value={value}>
                    {value} cards
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn--primary btn--block" onClick={startSession}>
              Start review
            </button>
          </div>
        </Panel>
        <div className="mt-3">
          <ReviewHistory summaries={reviewSummaries} />
        </div>
      </div>
    )
  }

  if (total === 0) {
    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <PageHeader eyebrow="Retention // Spaced Repetition" title="Review Queue" />
        <Panel>
          <EmptyState glyph="✓" title="Session unavailable" hint="The saved review session no longer has available questions. Start a fresh review when new cards are due.">
            <button className="btn btn--ghost" onClick={resetSavedSession}>
              Clear saved session
            </button>
          </EmptyState>
        </Panel>
      </div>
    )
  }

  // done
  if (idx >= total) {
    const acc = Math.round((correct / total) * 100)
    const finishedAt = completedAt ?? Date.now()
    const timeMs = Math.max(0, finishedAt - sessionCreatedAt)
    const firstWeak = weakModules[0]
    return (
      <div className="page" style={{ maxWidth: 780 }}>
        <Panel brackets pad="lg">
          <div className="center">
            <div className="page__eyebrow">Review complete</div>
            <div className="stat__value neon-cyan" style={{ fontSize: '3rem' }}>
              {correct}/{total}
            </div>
            <p className="muted">{acc}% recall · cards rescheduled</p>
            <p className="term t-xs dim mt-1">Missed cards return tomorrow. Strong recalls move further out.</p>
            <div className="grid-4 mt-3" style={{ textAlign: 'left' }}>
              <div>
                <div className="stat__value">{acc}%</div>
                <div className="stat__label">Session accuracy</div>
              </div>
              <div>
                <div className="stat__value">{formatDuration(Math.round(timeMs / 1000))}</div>
                <div className="stat__label">Time spent</div>
              </div>
              <div>
                <div className="stat__value">{missedIds.length}</div>
                <div className="stat__label">New mistakes</div>
              </div>
              <div>
                <div className="stat__value">{masteredIds.length}</div>
                <div className="stat__label">Mastered items</div>
              </div>
            </div>
            {reasoningGaps > 0 && (
              <p className="term t-xs mt-1 neon-cyan">
                {reasoningGaps} reasoning gap note{reasoningGaps === 1 ? '' : 's'} captured for follow-up.
              </p>
            )}
            {weakModules.length > 0 && (
              <div className="mt-3" style={{ textAlign: 'left' }}>
                <div className="term t-xs dim mb-1">Weak modules from this review</div>
                <div className="row wrap" style={{ gap: '0.4rem' }}>
                  {weakModules.map((m) => (
                    <span key={m.module} className="badge badge--amber">
                      {m.module === 0 ? 'CEH+' : `M${String(m.module).padStart(2, '0')}`} · {m.missed} miss
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3" style={{ textAlign: 'left' }}>
              <div className="term t-xs dim mb-1">Next actions</div>
              <ol className="t-sm" style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {nextActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </div>
            {incompleteMistakeNotes > 0 && (
              <p className="term t-xs mt-2" style={{ color: 'var(--warning-amber)' }}>
                {incompleteMistakeNotes} missed card{incompleteMistakeNotes === 1 ? '' : 's'} still need notebook fields.
              </p>
            )}
            {correct < total && (
              <p className="term t-xs mt-1" style={{ color: 'var(--warning-amber)' }}>
                Update the Mistake Notebook for missed cards before the context fades.
              </p>
            )}
            <div className="row center wrap mt-3" style={{ justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn--primary" onClick={() => navigate('/')}>
                ◈ Dashboard
              </button>
              {firstWeak && (
                <Link to={`/practice?module=${firstWeak.module}`} className="btn btn--magenta">
                  Drill weakest module
                </Link>
              )}
              {correct < total && (
                <Link to="/mistakes" className="btn btn--magenta">
                  ⚑ Update notebook
                </Link>
              )}
              <button className="btn btn--ghost" onClick={() => navigate('/practice')}>
                ✦ Keep drilling
              </button>
              <button className="btn btn--ghost" onClick={resetSavedSession}>
                New review
              </button>
            </div>
          </div>
        </Panel>
        <div className="mt-3">
          <ReviewHistory summaries={reviewSummaries} />
        </div>
      </div>
    )
  }

  const current = qmap.get(queue[idx])
  if (!current) {
    // question vanished (archived) — skip
    onNext(false)
    return null
  }
  const progress = (idx / total) * 100

  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <div className="row row--between mb-2">
        <span className="page__eyebrow" style={{ margin: 0 }}>
          Daily Review · cap {reviewDailyLimit}/day
        </span>
        <span className="term t-sm dim tabnum">
          {idx + 1} / {total}
        </span>
      </div>
      <div className="row row--end mb-2">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/')}>
          Save & exit
        </button>
      </div>
      <div className="progressbar mb-3" style={{ height: 4 }}>
        <div style={{ position: 'absolute', inset: 0, width: `${progress}%`, background: 'var(--border-cyan)' }} />
      </div>
      <Panel>
        <QuestionRunner key={current.id} question={current} mode="review" index={idx} total={total} onNext={onNext} />
      </Panel>
    </div>
  )
}
