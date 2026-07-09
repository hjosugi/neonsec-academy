import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDueQueue, useQuestionMap } from '../store/selectors'
import { useStore } from '../store/useStore'
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

export function Review() {
  const navigate = useNavigate()
  const dueNow = useDueQueue()
  const qmap = useQuestionMap()
  const reviewDailyLimit = useStore((s) => s.settings.reviewDailyLimit ?? 20)
  const saved = readSavedReviewSession()
  const maxSessionSize = Math.max(0, dueNow.length)
  const [sessionSize, setSessionSize] = useState(() => Math.min(maxSessionSize || reviewDailyLimit, reviewDailyLimit))

  // freeze the queue at session start so grading doesn't reshuffle mid-run
  const [started, setStarted] = useState(() => !!saved?.queue.length)
  const [queue, setQueue] = useState<string[]>(() => saved?.queue ?? [])
  const [idx, setIdx] = useState(() => saved?.idx ?? 0)
  const [correct, setCorrect] = useState(() => saved?.correct ?? 0)
  const [reasoningGaps, setReasoningGaps] = useState(() => saved?.reasoningGaps ?? 0)

  const total = queue.length

  useEffect(() => {
    if (!started || total === 0 || idx >= total) return
    saveReviewSession({ queue, idx, correct, reasoningGaps, createdAt: saved?.createdAt ?? Date.now() })
  }, [started, queue, idx, correct, reasoningGaps, total, saved?.createdAt])

  useEffect(() => {
    if (started && total > 0 && idx >= total) clearReviewSession()
  }, [started, idx, total])

  const startSession = () => {
    const nextQueue = dueNow.slice(0, Math.max(1, sessionSize)).map((e) => e.question.id)
    setQueue(nextQueue)
    setIdx(0)
    setCorrect(0)
    setReasoningGaps(0)
    setStarted(true)
    saveReviewSession({ queue: nextQueue, idx: 0, correct: 0, reasoningGaps: 0, createdAt: Date.now() })
  }

  const resetSavedSession = () => {
    clearReviewSession()
    setQueue([])
    setIdx(0)
    setCorrect(0)
    setReasoningGaps(0)
    setStarted(false)
  }

  const onNext = (ok: boolean, reasoningGap?: string) => {
    if (ok) setCorrect((c) => c + 1)
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
    return (
      <div className="page" style={{ maxWidth: 620 }}>
        <Panel brackets pad="lg">
          <div className="center">
            <div className="page__eyebrow">Review complete</div>
            <div className="stat__value neon-cyan" style={{ fontSize: '3rem' }}>
              {correct}/{total}
            </div>
            <p className="muted">{acc}% recall · cards rescheduled</p>
            <p className="term t-xs dim mt-1">Missed cards return tomorrow. Strong recalls move further out.</p>
            {reasoningGaps > 0 && (
              <p className="term t-xs mt-1 neon-cyan">
                {reasoningGaps} reasoning gap note{reasoningGaps === 1 ? '' : 's'} captured for follow-up.
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
