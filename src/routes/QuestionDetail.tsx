import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAllQuestionMap } from '../store/selectors'
import { DISTRICTS, DOMAINS } from '../data/taxonomy'
import { relativeDay } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'
import { QuestionRunner } from '../components/question/QuestionRunner'

export function QuestionDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qmap = useAllQuestionMap()
  const question = qmap.get(id)

  const reviews = useStore((s) => s.reviews)
  const attempts = useStore((s) => s.attempts)
  const archivedIds = useStore((s) => s.archivedIds)
  const archiveQuestion = useStore((s) => s.archiveQuestion)
  const unarchiveQuestion = useStore((s) => s.unarchiveQuestion)

  if (!question) {
    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <Panel>
          <EmptyState glyph="⌀" title="Question not found" hint="It may have been archived or the link is stale.">
            <button className="btn btn--primary" onClick={() => navigate('/bank')}>
              ← Back to bank
            </button>
          </EmptyState>
        </Panel>
      </div>
    )
  }

  const review = reviews[question.id]
  const myAttempts = attempts.filter((a) => a.questionId === question.id)
  const lastAttempt = myAttempts[myAttempts.length - 1]
  const isUser = question.source === 'user'
  const isArchived = archivedIds.includes(question.id)
  const district = DISTRICTS.find((d) => d.id === question.district)

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>Bank // <span className="mono">{question.id}</span></>}
        title={question.title ?? 'Question Detail'}
        actions={
          <button className="btn btn--ghost btn--sm" onClick={() => navigate('/bank')}>
            ← Bank
          </button>
        }
      />

      <div className="qconsole">
        <Panel>
          <QuestionRunner key={question.id} question={question} mode="practice" onNext={() => navigate('/bank')} />
        </Panel>

        <div className="inspector">
          <Panel title="Metadata">
            <div className="inspector__row">
              <span className="k">Module</span>
              <span className="right">{question.module === 0 ? 'CEH+' : `M${question.module}`}</span>
            </div>
            <div className="inspector__row">
              <span className="k">Domain</span>
              <span className="right">{DOMAINS[question.domain].short}</span>
            </div>
            <div className="inspector__row">
              <span className="k">District</span>
              <span className="right" style={{ color: district?.color }}>
                {district?.name}
              </span>
            </div>
            <div className="inspector__row">
              <span className="k">Type</span>
              <span className="right">{question.type}</span>
            </div>
            <div className="inspector__row">
              <span className="k">Source</span>
              <span className="right">{isUser ? 'my question' : 'seed'}</span>
            </div>
            <div className="row wrap mt-2" style={{ gap: '0.3rem' }}>
              {question.tags.map((t) => (
                <span key={t} className="chip">
                  #{t}
                </span>
              ))}
            </div>
          </Panel>

          <Panel title="Review Schedule">
            {review ? (
              <>
                <div className="inspector__row">
                  <span className="k">Next due</span>
                  <span className="right">{relativeDay(review.dueAt)}</span>
                </div>
                <div className="inspector__row">
                  <span className="k">Interval</span>
                  <span className="right">{review.intervalDays}d</span>
                </div>
                <div className="inspector__row">
                  <span className="k">Ease</span>
                  <span className="right">{review.ease.toFixed(2)}</span>
                </div>
                <div className="inspector__row">
                  <span className="k">Reps / lapses</span>
                  <span className="right">
                    {review.reps} / {review.lapses}
                  </span>
                </div>
              </>
            ) : (
              <p className="term t-xs dim">Not in your review queue yet. Answer it to schedule it.</p>
            )}
            <div className="inspector__row">
              <span className="k">Attempts</span>
              <span className="right">{myAttempts.length}</span>
            </div>
            {lastAttempt && (
              <div className="inspector__row">
                <span className="k">Last result</span>
                <span className={`right ${lastAttempt.correct ? 'neon-green' : 'neon-red'}`}>
                  {lastAttempt.correct ? 'correct' : 'incorrect'}
                </span>
              </div>
            )}
          </Panel>

          <Panel title="Actions">
            <div className="stack stack--sm">
              <button
                className="btn btn--ghost btn--sm btn--block"
                onClick={() => navigate('/bank/new', { state: { prefill: question } })}
              >
                ❏ Duplicate & edit
              </button>
              {isUser && (
                <button className="btn btn--ghost btn--sm btn--block" onClick={() => navigate(`/bank/${encodeURIComponent(question.id)}/edit`)}>
                  ✎ Edit
                </button>
              )}
              {isArchived ? (
                <button className="btn btn--ghost btn--sm btn--block" onClick={() => unarchiveQuestion(question.id)}>
                  ⤴ Unarchive
                </button>
              ) : (
                <button className="btn btn--ghost btn--sm btn--block" onClick={() => archiveQuestion(question.id)}>
                  ⌦ Archive (hide)
                </button>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
