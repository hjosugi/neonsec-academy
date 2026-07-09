import { useEffect, useState } from 'react'
import type { AttemptConfidence, Grade, Question } from '../../types'
import { useStore } from '../../store/useStore'
import { correctChoices, isCorrect, isFreeform } from '../../lib/grade'
import { GRADE_META } from '../../lib/srs'
import { DOMAINS } from '../../data/taxonomy'
import { Markdown } from '../ui/Markdown'
import { Explanation } from './Explanation'

interface Props {
  question: Question
  mode: 'practice' | 'review'
  index?: number
  total?: number
  onNext: (correct: boolean) => void
}

const CONFIDENCE_OPTIONS: AttemptConfidence[] = [1, 2, 3, 4, 5]

export function QuestionRunner({ question, mode, index, total, onNext }: Props) {
  const recordAttempt = useStore((s) => s.recordAttempt)
  const gradeReview = useStore((s) => s.gradeReview)
  const bookmarks = useStore((s) => s.bookmarks)
  const toggleBookmark = useStore((s) => s.toggleBookmark)
  const upsertMistake = useStore((s) => s.upsertMistake)
  const hasMistake = useStore((s) => !!s.mistakes[question.id])

  const [selected, setSelected] = useState<string[]>([])
  const [freeformAnswer, setFreeformAnswer] = useState('')
  const [graded, setGraded] = useState(false)
  const [selfCorrect, setSelfCorrect] = useState<boolean | null>(null)
  const [mistakeAdded, setMistakeAdded] = useState(false)
  const [confidence, setConfidence] = useState<AttemptConfidence>(3)
  const [startedAt] = useState(() => Date.now())

  const isFreeformQuestion = isFreeform(question)
  const isMulti = question.type === 'multi'
  const correctSet = correctChoices(question)
  const chosenValue = isMulti ? selected : isFreeformQuestion ? freeformAnswer.trim() || null : selected[0] ?? null
  const correct = isFreeformQuestion ? selfCorrect === true : isCorrect(question, chosenValue)
  const bookmarked = bookmarks.includes(question.id)
  const elapsedMs = () => Math.max(0, Date.now() - startedAt)

  const pick = (choice: string) => {
    if (graded) return
    if (isMulti) {
      setSelected((s) => (s.includes(choice) ? s.filter((c) => c !== choice) : [...s, choice]))
    } else {
      setSelected([choice])
    }
  }

  const reveal = () => {
    if (graded) return
    setGraded(true)
    // practice + choice -> record immediately (correctness known)
    if (mode === 'practice' && !isFreeformQuestion) {
      recordAttempt(question.id, chosenValue, isCorrect(question, chosenValue), 'practice', elapsedMs(), confidence)
    }
  }

  const finishFreeform = (ok: boolean) => {
    setSelfCorrect(ok)
    if (mode === 'practice') {
      recordAttempt(question.id, chosenValue, ok, 'practice', elapsedMs(), confidence)
      onNext(ok)
    }
    // review free-form -> grade buttons handle it (see below)
  }

  const applyGrade = (g: Grade) => {
    const c = isFreeformQuestion ? g !== 'again' : correct
    gradeReview(question.id, g, c, chosenValue, elapsedMs(), confidence)
    onNext(c)
  }

  const addToMistakes = () => {
    upsertMistake(question.id, {
      correctReasoning: question.explanation.why,
      trapPattern: question.explanation.trap,
      memoryPhrase: question.explanation.memory_phrase,
    })
    setMistakeAdded(true)
  }

  // keyboard: 1-6 to pick, Enter to submit / advance in practice
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      if (!graded && !isFreeformQuestion && /^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1
        if (question.choices && i < question.choices.length) {
          e.preventDefault()
          pick(question.choices[i])
        }
      } else if (e.key === 'Enter') {
        if (!graded && (isFreeformQuestion || selected.length > 0)) {
          e.preventDefault()
          reveal()
        } else if (graded && mode === 'practice' && !isFreeformQuestion) {
          e.preventDefault()
          onNext(correct)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graded, selected, isFreeformQuestion])

  const choiceClass = (choice: string): string => {
    const cls = ['choice']
    if (!graded) {
      if (selected.includes(choice)) cls.push('is-selected')
    } else {
      if (correctSet.includes(choice)) cls.push('is-correct')
      else if (selected.includes(choice)) cls.push('is-wrong')
    }
    return cls.join(' ')
  }

  const confidenceControl = (
    <div className="row wrap mb-2" style={{ gap: '0.45rem' }}>
      <span className="term t-xs dim">Confidence</span>
      {CONFIDENCE_OPTIONS.map((value) => (
        <button
          key={value}
          type="button"
          className={`chip ${confidence === value ? 'chip--active' : ''}`}
          onClick={() => setConfidence(value)}
          title={`Confidence ${value} of 5`}
        >
          {value}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <div className="row row--between wrap mb-2" style={{ gap: '0.5rem' }}>
        <div className="row wrap" style={{ gap: '0.4rem' }}>
          {typeof index === 'number' && typeof total === 'number' && (
            <span className="term t-sm dim tabnum">
              {String(index + 1).padStart(2, '0')} / {total}
            </span>
          )}
          <span className="badge badge--cyan">{DOMAINS[question.domain].short}</span>
          <span className="badge">
            {question.module === 0 ? 'CEH+' : `M${String(question.module).padStart(2, '0')}`} · {question.moduleName.length > 26 ? question.moduleName.slice(0, 24) + '…' : question.moduleName}
          </span>
          <span className={`diff diff--${question.difficulty}`}>◆ {question.difficulty}</span>
          {isMulti && <span className="badge badge--purple">select all</span>}
          {isFreeformQuestion && <span className="badge badge--purple">self-graded</span>}
        </div>
        <button
          className={`btn btn--ghost btn--sm ${bookmarked ? 'btn--magenta' : ''}`}
          onClick={() => toggleBookmark(question.id)}
          title="Bookmark"
        >
          {bookmarked ? '★ pinned' : '☆ pin'}
        </button>
      </div>

      <div className="qbody mb-3">
        <Markdown source={question.body} />
      </div>

      {!isFreeformQuestion && (
        <div className="mb-2">
          {(question.choices ?? []).map((choice, i) => (
            <button key={i} className={choiceClass(choice)} onClick={() => pick(choice)} disabled={graded}>
              <span className="choice__key">{String.fromCharCode(65 + i)}</span>
              <span className="grow">
                <Markdown source={choice} />
              </span>
              {graded && correctSet.includes(choice) && <span className="neon-green">✓</span>}
              {graded && !correctSet.includes(choice) && selected.includes(choice) && <span className="neon-red">✕</span>}
            </button>
          ))}
        </div>
      )}

      {isFreeformQuestion && !graded && (
        <div className="field">
          <label className="label">{question.type === 'report_prompt' ? 'Draft report answer' : 'Your answer'}</label>
          <textarea
            className="textarea"
            value={freeformAnswer}
            onChange={(e) => setFreeformAnswer(e.target.value)}
            placeholder={question.type === 'short_answer' ? 'Write a concise answer before revealing the model answer.' : 'Write your reasoning before revealing the model answer.'}
          />
        </div>
      )}

      {(!graded || mode === 'review' || (isFreeformQuestion && selfCorrect === null)) && confidenceControl}

      {/* action bar */}
      {!graded && (
        <button className="btn btn--primary" onClick={reveal} disabled={!isFreeformQuestion && selected.length === 0}>
          {isFreeformQuestion ? 'Reveal model answer' : 'Submit answer'}
        </button>
      )}

      {graded && (
        <>
          {!isFreeformQuestion && (
            <div className={`badge ${correct ? 'badge--green' : 'badge--red'} mb-2`} style={{ fontSize: '0.8rem' }}>
              {correct ? '✓ Correct' : '✕ Incorrect'}
            </div>
          )}
          <Explanation q={question} />

          {/* mistake logging when wrong */}
          {!isFreeformQuestion && !correct && (
            <button
              className="btn btn--ghost btn--sm mt-2"
              onClick={addToMistakes}
              disabled={mistakeAdded || hasMistake}
            >
              {mistakeAdded || hasMistake ? '✓ in mistake notebook' : '＋ add to mistake notebook'}
            </button>
          )}

          <div className="divider" />

          {/* free-form self-assessment */}
          {isFreeformQuestion && selfCorrect === null && (
            <div className="row wrap" style={{ gap: '0.5rem' }}>
              <span className="term t-sm dim">How did you do?</span>
              <button className="btn btn--danger btn--sm" onClick={() => (mode === 'review' ? setSelfCorrect(false) : finishFreeform(false))}>
                Missed it
              </button>
              <button className="btn btn--green btn--sm" onClick={() => (mode === 'review' ? setSelfCorrect(true) : finishFreeform(true))}>
                Got it
              </button>
            </div>
          )}

          {/* practice next */}
          {mode === 'practice' && !isFreeformQuestion && (
            <div className="row row--end">
              <button className="btn btn--primary" onClick={() => onNext(correct)}>
                Next →
              </button>
            </div>
          )}

          {/* review grade buttons */}
          {mode === 'review' && (!isFreeformQuestion || selfCorrect !== null) && (
            <div>
              <div className="term t-xs dim mb-1">Rate your recall — this sets the next review date</div>
              <div className="row wrap" style={{ gap: '0.5rem' }}>
                {(Object.keys(GRADE_META) as Grade[]).map((g) => (
                  <button key={g} className={`btn btn--sm ${GRADE_META[g].cls}`} onClick={() => applyGrade(g)} title={GRADE_META[g].hint}>
                    {GRADE_META[g].label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
