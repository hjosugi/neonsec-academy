import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { useAllQuestionMap } from '../store/selectors'
import { DISTRICTS, DOMAINS } from '../data/taxonomy'
import { DAY, formatDateTime, formatDuration, pct, relativeDay, startOfDay } from '../lib/format'
import type { Attempt } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'
import { QuestionRunner } from '../components/question/QuestionRunner'

function attemptAnswer(attempt: Attempt): string {
  if (attempt.chosen == null) return '-'
  const raw = Array.isArray(attempt.chosen) ? attempt.chosen.join(', ') : attempt.chosen
  return raw.length > 96 ? `${raw.slice(0, 93)}...` : raw
}

function shortText(value?: string): string {
  if (!value?.trim()) return '-'
  return value.length > 96 ? `${value.slice(0, 93)}...` : value
}

function attemptTime(attempt: Attempt): string {
  return typeof attempt.timeMs === 'number' ? formatDuration(Math.round(attempt.timeMs / 1000)) : '-'
}

function averageConfidence(attempts: Attempt[]): number {
  const values = attempts
    .map((attempt) => attempt.confidence)
    .filter((value): value is NonNullable<Attempt['confidence']> => typeof value === 'number')
  if (values.length === 0) return -1
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function confidenceTrend(attempts: Attempt[]): string {
  const values = attempts
    .map((attempt) => attempt.confidence)
    .filter((value): value is NonNullable<Attempt['confidence']> => typeof value === 'number')
  if (values.length < 2) return 'insufficient data'
  const previous = values.slice(0, -1).reduce((sum, value) => sum + value, 0) / (values.length - 1)
  const diff = values[values.length - 1] - previous
  if (Math.abs(diff) < 0.25) return 'flat'
  return diff > 0 ? 'improving' : 'slipping'
}

function mistakeNeedsNotes(note: { whyWrong: string; correctReasoning: string; memoryPhrase: string; nextAction: string }): boolean {
  return [note.whyWrong, note.correctReasoning, note.memoryPhrase, note.nextAction].some((value) => value.trim() === '')
}

export function QuestionDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const qmap = useAllQuestionMap()
  const question = qmap.get(id)

  const reviews = useStore((s) => s.reviews)
  const attempts = useStore((s) => s.attempts)
  const mistakes = useStore((s) => s.mistakes)
  const bookmarks = useStore((s) => s.bookmarks)
  const pinNote = useStore((s) => s.pinNotes[id] ?? '')
  const archivedIds = useStore((s) => s.archivedIds)
  const archiveQuestion = useStore((s) => s.archiveQuestion)
  const unarchiveQuestion = useStore((s) => s.unarchiveQuestion)
  const rescheduleReview = useStore((s) => s.rescheduleReview)
  const toggleBookmark = useStore((s) => s.toggleBookmark)
  const updatePinNote = useStore((s) => s.updatePinNote)
  const [retryMsg, setRetryMsg] = useState('')

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
  const mistake = mistakes[question.id]
  const myAttempts = attempts.filter((a) => a.questionId === question.id).sort((a, b) => a.at - b.at)
  const lastAttempt = myAttempts[myAttempts.length - 1]
  const correctAttempts = myAttempts.filter((a) => a.correct).length
  const accuracy = myAttempts.length > 0 ? correctAttempts / myAttempts.length : -1
  const avgConfidence = averageConfidence(myAttempts)
  const confidenceDirection = confidenceTrend(myAttempts)
  const isUser = question.source === 'user'
  const isArchived = archivedIds.includes(question.id)
  const bookmarked = bookmarks.includes(question.id)
  const district = DISTRICTS.find((d) => d.id === question.district)
  const setReviewDueIn = (days: number) => rescheduleReview(question.id, startOfDay(Date.now()) + days * DAY)
  const retryLater = () => {
    setReviewDueIn(0)
    setRetryMsg('Added to today\'s review queue.')
  }

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
                <div className="inspector__row">
                  <span className="k">Confidence</span>
                  <span className="right">{review.confidence ? `${review.confidence}/5` : '-'}</span>
                </div>
                <div className="row wrap mt-2" style={{ gap: '0.45rem' }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => setReviewDueIn(0)}>
                    Due now
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setReviewDueIn(1)}>
                    Tomorrow
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setReviewDueIn(7)}>
                    +7d
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="term t-xs dim">Not in your review queue yet. Add it manually or answer it to schedule it.</p>
                <div className="row wrap mt-2" style={{ gap: '0.45rem' }}>
                  <button className="btn btn--ghost btn--sm" onClick={() => setReviewDueIn(0)}>
                    Due now
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setReviewDueIn(1)}>
                    Tomorrow
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => setReviewDueIn(7)}>
                    +7d
                  </button>
                </div>
              </>
            )}
            <div className="inspector__row">
              <span className="k">Attempts</span>
              <span className="right">{myAttempts.length}</span>
            </div>
            {myAttempts.length > 0 && (
              <div className="inspector__row">
                <span className="k">Accuracy</span>
                <span className="right">{pct(accuracy)}</span>
              </div>
            )}
            {avgConfidence >= 0 && (
              <>
                <div className="inspector__row">
                  <span className="k">Avg confidence</span>
                  <span className="right">{avgConfidence.toFixed(1)}/5</span>
                </div>
                <div className="inspector__row">
                  <span className="k">Confidence trend</span>
                  <span className="right">{confidenceDirection}</span>
                </div>
              </>
            )}
            {lastAttempt && (
              <>
                <div className="inspector__row">
                  <span className="k">Last attempted</span>
                  <span className="right">{formatDateTime(lastAttempt.at)}</span>
                </div>
                <div className="inspector__row">
                  <span className="k">Last result</span>
                  <span className={`right ${lastAttempt.correct ? 'neon-green' : 'neon-red'}`}>
                    {lastAttempt.correct ? 'correct' : 'incorrect'}
                  </span>
                </div>
              </>
            )}
          </Panel>

          <Panel title="Pin & Retry">
            <div className="stack stack--sm">
              <button
                className={`btn btn--ghost btn--sm btn--block ${bookmarked ? 'btn--magenta' : ''}`}
                onClick={() => toggleBookmark(question.id)}
              >
                {bookmarked ? '★ Pinned' : '☆ Pin for later'}
              </button>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Pin note</label>
                <textarea
                  className="textarea"
                  value={pinNote}
                  onChange={(e) => updatePinNote(question.id, e.target.value)}
                  placeholder="Why should this be revisited before the exam?"
                  style={{ minHeight: 86 }}
                />
                <div className="term t-xs dim mt-1">Saving a note also pins the question.</div>
              </div>
              <button className="btn btn--ghost btn--sm btn--block" onClick={retryLater}>
                ↻ Retry later
              </button>
              {retryMsg && <p className="term t-xs neon-cyan">{retryMsg}</p>}
            </div>
          </Panel>

          {mistake && (
            <Panel title="Mistake Note">
              <div className="stack stack--sm">
                <div className="row wrap" style={{ gap: '0.4rem' }}>
                  <span className={`badge ${mistake.resolved ? 'badge--green' : 'badge--amber'}`}>
                    {mistake.resolved ? 'resolved' : 'open'}
                  </span>
                  {mistakeNeedsNotes(mistake) && <span className="badge badge--amber">needs notes</span>}
                  <span className="term t-xs dim">Updated {formatDateTime(mistake.updatedAt)}</span>
                </div>
                <p className="term t-xs muted">
                  {mistake.memoryPhrase || mistake.trapPattern || 'Capture why this missed answer happened and what to do next.'}
                </p>
                <div className="inspector__row">
                  <span className="k">Why wrong</span>
                  <span className="right">{mistake.whyWrong || '-'}</span>
                </div>
                <div className="inspector__row">
                  <span className="k">Correct reasoning</span>
                  <span className="right">{mistake.correctReasoning || '-'}</span>
                </div>
                {mistake.reasoningGap && (
                  <div className="inspector__row">
                    <span className="k">Reasoning gap</span>
                    <span className="right">{mistake.reasoningGap}</span>
                  </div>
                )}
                <div className="inspector__row">
                  <span className="k">Next action</span>
                  <span className="right">{mistake.nextAction || '-'}</span>
                </div>
                <button className="btn btn--ghost btn--sm btn--block" onClick={() => navigate('/mistakes')}>
                  Open notebook
                </button>
              </div>
            </Panel>
          )}

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

      <div className="mt-3">
        <Panel title="Attempt History">
          {myAttempts.length === 0 ? (
            <p className="term t-xs dim">No attempts yet. Submit an answer to start the timeline.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>When</th>
                    <th>Mode</th>
                    <th>Result</th>
                    <th>Selected answer</th>
                    <th>Reasoning gap</th>
                    <th>Time</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttempts.map((attempt, index) => (
                    <tr key={attempt.id}>
                      <td className="term t-sm tabnum">{index + 1}</td>
                      <td className="term t-sm nowrap">{formatDateTime(attempt.at)}</td>
                      <td className="term t-sm">{attempt.mode}</td>
                      <td className={attempt.correct ? 'neon-green' : 'neon-red'}>
                        {attempt.correct ? 'correct' : 'incorrect'}
                      </td>
                      <td title={attempt.chosen == null ? undefined : Array.isArray(attempt.chosen) ? attempt.chosen.join(', ') : attempt.chosen}>
                        {attemptAnswer(attempt)}
                      </td>
                      <td title={attempt.reasoningGap}>{shortText(attempt.reasoningGap)}</td>
                      <td className="term t-sm tabnum">{attemptTime(attempt)}</td>
                      <td className="term t-sm tabnum">{attempt.confidence ? `${attempt.confidence}/5` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
