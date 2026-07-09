import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AttemptConfidence } from '../types'
import { useStore } from '../store/useStore'
import { useQuestionMap } from '../store/selectors'
import { DOMAINS } from '../data/taxonomy'
import { formatDuration } from '../lib/format'
import { Markdown } from '../components/ui/Markdown'
import { Panel } from '../components/ui/Panel'
import { Modal } from '../components/ui/Modal'

export function ExamRunner() {
  const navigate = useNavigate()
  const activeExam = useStore((s) => s.activeExam)
  const examAnswer = useStore((s) => s.examAnswer)
  const examToggleFlag = useStore((s) => s.examToggleFlag)
  const examSetConfidence = useStore((s) => s.examSetConfidence)
  const examAddTime = useStore((s) => s.examAddTime)
  const examGoto = useStore((s) => s.examGoto)
  const submitExam = useStore((s) => s.submitExam)
  const qmap = useQuestionMap()

  const [now, setNow] = useState(Date.now())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const doneRef = useRef(false)
  const questionClock = useRef<{ qid: string | null; at: number }>({ qid: null, at: Date.now() })

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const flushQuestionTime = (clear = false) => {
    const current = questionClock.current
    if (current.qid) examAddTime(current.qid, Date.now() - current.at)
    questionClock.current = { qid: clear ? null : current.qid, at: Date.now() }
  }

  const doSubmit = () => {
    if (doneRef.current) return
    doneRef.current = true
    flushQuestionTime(true)
    const r = submitExam()
    navigate(r ? `/exam/result/${r.sessionId}` : '/exam')
  }

  const remaining = activeExam ? activeExam.durationSec - Math.floor((now - activeExam.startedAt) / 1000) : 0

  useEffect(() => {
    if (activeExam && remaining <= 0 && !doneRef.current) doSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, activeExam])

  useEffect(() => {
    if (!activeExam && !doneRef.current) navigate('/exam')
  }, [activeExam, navigate])

  const idx = activeExam?.currentIndex ?? 0
  const qid = activeExam?.questionIds[idx] ?? null

  useEffect(() => {
    if (!qid) return
    const current = questionClock.current
    const changed = current.qid && current.qid !== qid
    if (changed) examAddTime(current.qid!, Date.now() - current.at)
    questionClock.current = { qid, at: Date.now() }
  }, [examAddTime, qid])

  useEffect(
    () => () => {
      const current = questionClock.current
      if (current.qid) examAddTime(current.qid, Date.now() - current.at)
    },
    [examAddTime],
  )

  if (!activeExam || !qid) return null

  const question = qmap.get(qid)
  const chosen = activeExam.answers[qid]?.chosen ?? null
  const flagged = activeExam.answers[qid]?.flagged ?? false
  const confidence = activeExam.answers[qid]?.confidence ?? null
  const choices = activeExam.choiceOrder?.[qid] ?? question?.choices ?? []
  const answeredCount = activeExam.questionIds.filter((id) => {
    const c = activeExam.answers[id]?.chosen
    return c != null && !(Array.isArray(c) && c.length === 0)
  }).length

  const pick = (choice: string) => {
    if (!question) return
    if (question.type === 'multi') {
      const arr = Array.isArray(chosen) ? chosen : []
      examAnswer(qid, arr.includes(choice) ? arr.filter((c) => c !== choice) : [...arr, choice])
    } else {
      examAnswer(qid, choice)
    }
  }

  const selected = (choice: string) =>
    question?.type === 'multi' ? Array.isArray(chosen) && chosen.includes(choice) : chosen === choice

  const lowTime = remaining <= 300

  return (
    <div className="page">
      <div className="row row--between wrap mb-3" style={{ gap: '0.6rem' }}>
        <div className="row" style={{ gap: '0.6rem' }}>
          <span className="badge badge--magenta">{activeExam.presetLabel}</span>
          <span className="term t-sm dim tabnum">
            {answeredCount}/{activeExam.questionIds.length} answered
          </span>
        </div>
        <div className={`exam-timer ${lowTime ? 'is-low' : ''}`} title="Time remaining">
          ⏱ {formatDuration(Math.max(0, remaining))}
        </div>
      </div>

      <div className="exam">
        <Panel>
          {question ? (
            <>
              <div className="row row--between wrap mb-2" style={{ gap: '0.4rem' }}>
                <div className="row wrap" style={{ gap: '0.4rem' }}>
                  <span className="term t-sm dim tabnum">
                    {String(idx + 1).padStart(2, '0')} / {activeExam.questionIds.length}
                  </span>
                  <span className="badge badge--cyan">{DOMAINS[question.domain].short}</span>
                  {question.type === 'multi' && <span className="badge badge--purple">select all</span>}
                </div>
                <button className={`btn btn--sm ${flagged ? 'btn--magenta' : 'btn--ghost'}`} onClick={() => examToggleFlag(qid)}>
                  {flagged ? '⚑ flagged' : '⚐ flag'}
                </button>
              </div>
              <div className="row wrap mb-2" style={{ gap: '0.45rem' }}>
                <span className="term t-xs dim">Confidence</span>
                <div className="segmented">
                  {([1, 2, 3, 4, 5] as AttemptConfidence[]).map((value) => (
                    <button
                      key={value}
                      className={confidence === value ? 'is-active' : ''}
                      onClick={() => examSetConfidence(qid, confidence === value ? null : value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="qbody mb-3">
                <Markdown source={question.body} />
              </div>

              <div>
                {choices.map((choice, i) => (
                  <button key={i} className={`choice ${selected(choice) ? 'is-selected' : ''}`} onClick={() => pick(choice)}>
                    <span className="choice__key">{String.fromCharCode(65 + i)}</span>
                    <span className="grow">
                      <Markdown source={choice} />
                    </span>
                  </button>
                ))}
              </div>

              <div className="row row--between mt-3">
                <button className="btn btn--ghost" onClick={() => examGoto(idx - 1)} disabled={idx === 0}>
                  ← Prev
                </button>
                {idx < activeExam.questionIds.length - 1 ? (
                  <button className="btn btn--primary" onClick={() => examGoto(idx + 1)}>
                    Next →
                  </button>
                ) : (
                  <button className="btn btn--green" onClick={() => setConfirmOpen(true)}>
                    Finish ✓
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="muted">Question unavailable.</p>
          )}
        </Panel>

        <div className="inspector">
          <Panel title="Navigator">
            <div className="exam__navigator">
              {activeExam.questionIds.map((id, i) => {
                const a = activeExam.answers[id]
                const answered = a?.chosen != null && !(Array.isArray(a.chosen) && a.chosen.length === 0)
                const cls = ['exam__cell']
                if (i === idx) cls.push('is-current')
                else if (a?.flagged) cls.push('is-flagged')
                else if (answered) cls.push('is-answered')
                return (
                  <button key={id} className={cls.join(' ')} onClick={() => examGoto(i)}>
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="row wrap mt-2" style={{ gap: '0.5rem' }}>
              <span className="term t-xs"><span className="led" /> answered</span>
              <span className="term t-xs"><span className="led led--amber" /> flagged</span>
            </div>
            <button className="btn btn--green btn--block mt-2" onClick={() => setConfirmOpen(true)}>
              Submit exam
            </button>
          </Panel>
        </div>
      </div>

      {confirmOpen && (
        <Modal
          title="Submit exam?"
          onClose={() => setConfirmOpen(false)}
          footer={
            <div className="row row--end full" style={{ gap: '0.5rem' }}>
              <button className="btn btn--ghost" onClick={() => setConfirmOpen(false)}>
                Keep going
              </button>
              <button className="btn btn--green" onClick={doSubmit}>
                Submit &amp; grade
              </button>
            </div>
          }
        >
          <p className="muted">
            You have answered <span className="neon-cyan">{answeredCount}</span> of{' '}
            {activeExam.questionIds.length}. Unanswered questions are marked incorrect.
          </p>
        </Modal>
      )}
    </div>
  )
}
