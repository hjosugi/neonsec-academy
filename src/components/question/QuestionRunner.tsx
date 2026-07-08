import { useEffect, useState } from 'react'
import type { Grade, Question } from '../../types'
import { useStore } from '../../store/useStore'
import { correctChoices, isCorrect } from '../../lib/grade'
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

export function QuestionRunner({ question, mode, index, total, onNext }: Props) {
  const recordAttempt = useStore((s) => s.recordAttempt)
  const gradeReview = useStore((s) => s.gradeReview)
  const bookmarks = useStore((s) => s.bookmarks)
  const toggleBookmark = useStore((s) => s.toggleBookmark)
  const upsertMistake = useStore((s) => s.upsertMistake)
  const hasMistake = useStore((s) => !!s.mistakes[question.id])

  const [selected, setSelected] = useState<string[]>([])
  const [graded, setGraded] = useState(false)
  const [selfCorrect, setSelfCorrect] = useState<boolean | null>(null)
  const [mistakeAdded, setMistakeAdded] = useState(false)

  const isScenario = question.type === 'scenario'
  const isMulti = question.type === 'multi'
  const correctSet = correctChoices(question)
  const chosenValue = isMulti ? selected : selected[0] ?? null
  const correct = isScenario ? selfCorrect === true : isCorrect(question, chosenValue)
  const bookmarked = bookmarks.includes(question.id)

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
    // practice + choice → record immediately (correctness known)
    if (mode === 'practice' && !isScenario) {
      recordAttempt(question.id, chosenValue, isCorrect(question, chosenValue), 'practice')
    }
  }

  const finishScenario = (ok: boolean) => {
    setSelfCorrect(ok)
    if (mode === 'practice') {
      recordAttempt(question.id, null, ok, 'practice')
      onNext(ok)
    }
    // review scenario → grade buttons handle it (see below)
  }

  const applyGrade = (g: Grade) => {
    const c = isScenario ? g !== 'again' : correct
    gradeReview(question.id, g, c)
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
      if (!graded && !isScenario && /^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1
        if (question.choices && i < question.choices.length) {
          e.preventDefault()
          pick(question.choices[i])
        }
      } else if (e.key === 'Enter') {
        if (!graded && (isScenario || selected.length > 0)) {
          e.preventDefault()
          reveal()
        } else if (graded && mode === 'practice' && !isScenario) {
          e.preventDefault()
          onNext(correct)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graded, selected, isScenario])

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

      {!isScenario && (
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

      {/* action bar */}
      {!graded && (
        <button className="btn btn--primary" onClick={reveal} disabled={!isScenario && selected.length === 0}>
          {isScenario ? 'Reveal model answer' : 'Submit answer'}
        </button>
      )}

      {graded && (
        <>
          {!isScenario && (
            <div className={`badge ${correct ? 'badge--green' : 'badge--red'} mb-2`} style={{ fontSize: '0.8rem' }}>
              {correct ? '✓ Correct' : '✕ Incorrect'}
            </div>
          )}
          <Explanation q={question} />

          {/* mistake logging when wrong */}
          {!isScenario && !correct && (
            <button
              className="btn btn--ghost btn--sm mt-2"
              onClick={addToMistakes}
              disabled={mistakeAdded || hasMistake}
            >
              {mistakeAdded || hasMistake ? '✓ in mistake notebook' : '＋ add to mistake notebook'}
            </button>
          )}

          <div className="divider" />

          {/* scenario self-assessment */}
          {isScenario && selfCorrect === null && (
            <div className="row wrap" style={{ gap: '0.5rem' }}>
              <span className="term t-sm dim">How did you do?</span>
              <button className="btn btn--danger btn--sm" onClick={() => (mode === 'review' ? setSelfCorrect(false) : finishScenario(false))}>
                Missed it
              </button>
              <button className="btn btn--green btn--sm" onClick={() => (mode === 'review' ? setSelfCorrect(true) : finishScenario(true))}>
                Got it
              </button>
            </div>
          )}

          {/* practice next */}
          {mode === 'practice' && !isScenario && (
            <div className="row row--end">
              <button className="btn btn--primary" onClick={() => onNext(correct)}>
                Next →
              </button>
            </div>
          )}

          {/* review grade buttons */}
          {mode === 'review' && (!isScenario || selfCorrect !== null) && (
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
