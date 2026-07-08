import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDueQueue, useQuestionMap } from '../store/selectors'
import { useStore } from '../store/useStore'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'
import { QuestionRunner } from '../components/question/QuestionRunner'

export function Review() {
  const navigate = useNavigate()
  const dueNow = useDueQueue()
  const qmap = useQuestionMap()
  const dailyGoal = useStore((s) => s.settings.dailyGoal)

  // freeze the queue at session start so grading doesn't reshuffle mid-run
  const [queue] = useState<string[]>(() => dueNow.map((e) => e.question.id))
  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)

  const total = queue.length

  const onNext = (ok: boolean) => {
    if (ok) setCorrect((c) => c + 1)
    setIdx((i) => i + 1)
  }

  if (total === 0) {
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
            <div className="row center wrap mt-3" style={{ justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn--primary" onClick={() => navigate('/')}>
                ◈ Dashboard
              </button>
              <button className="btn btn--ghost" onClick={() => navigate('/practice')}>
                ✦ Keep drilling
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
          Daily Review · goal {dailyGoal}/day
        </span>
        <span className="term t-sm dim tabnum">
          {idx + 1} / {total}
        </span>
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
