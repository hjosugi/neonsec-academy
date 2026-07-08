import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MistakeNote, Question } from '../types'
import { useStore } from '../store/useStore'
import { useQuestionMap } from '../store/selectors'
import { DOMAINS } from '../data/taxonomy'
import { formatDate } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const FIELDS: { key: keyof MistakeNote; label: string }[] = [
  { key: 'whyWrong', label: 'Why I was wrong' },
  { key: 'correctReasoning', label: 'Correct reasoning' },
  { key: 'trapPattern', label: 'Trap pattern' },
  { key: 'memoryPhrase', label: 'Memory phrase' },
  { key: 'nextAction', label: 'Next action' },
]

function MistakeCard({ note, question }: { note: MistakeNote; question?: Question }) {
  const upsert = useStore((s) => s.upsertMistake)
  const del = useStore((s) => s.deleteMistake)
  const toggle = useStore((s) => s.toggleMistakeResolved)

  return (
    <div className="panel" style={{ opacity: note.resolved ? 0.6 : 1 }}>
      <div className="row row--between wrap mb-1" style={{ gap: '0.4rem' }}>
        <div className="row wrap" style={{ gap: '0.4rem' }}>
          {question && <span className="badge badge--cyan">{question.module === 0 ? 'CEH+' : `M${question.module}`}</span>}
          {question && <span className="badge">{DOMAINS[question.domain].short}</span>}
          {note.resolved && <span className="badge badge--green">resolved</span>}
          <span className="term t-xs dim">{formatDate(note.updatedAt)}</span>
        </div>
        <div className="row" style={{ gap: '0.35rem' }}>
          <button className="btn btn--ghost btn--sm" onClick={() => toggle(note.questionId)}>
            {note.resolved ? '↺ reopen' : '✓ resolve'}
          </button>
          <button className="btn btn--danger btn--sm" onClick={() => del(note.questionId)}>
            ✕
          </button>
        </div>
      </div>

      {question ? (
        <Link to={`/bank/${encodeURIComponent(question.id)}`} className="t-sm link-reset" style={{ display: 'block', color: 'var(--text-main)' }}>
          {question.body.length > 160 ? question.body.slice(0, 158) + '…' : question.body}
        </Link>
      ) : (
        <p className="dim t-sm">Question no longer available.</p>
      )}

      <div className="grid-2 mt-2" style={{ gap: '0.6rem' }}>
        {FIELDS.map((f) => (
          <div key={f.key} className="field" style={{ margin: 0 }}>
            <label className="label">{f.label}</label>
            <textarea
              className="textarea"
              style={{ minHeight: 52 }}
              defaultValue={(note[f.key] as string) ?? ''}
              onBlur={(e) => upsert(note.questionId, { [f.key]: e.target.value } as Partial<MistakeNote>)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Mistakes() {
  const mistakes = useStore((s) => s.mistakes)
  const qmap = useQuestionMap()
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open')

  const list = useMemo(() => {
    const arr = Object.values(mistakes).sort((a, b) => b.updatedAt - a.updatedAt)
    if (filter === 'open') return arr.filter((m) => !m.resolved)
    if (filter === 'resolved') return arr.filter((m) => m.resolved)
    return arr
  }, [mistakes, filter])

  const openCount = Object.values(mistakes).filter((m) => !m.resolved).length

  return (
    <div className="page">
      <PageHeader
        eyebrow="Retention // Mistake Notebook"
        title="Mistakes"
        sub="Turn every miss into a lesson. Note the trap, the fix, and what to do next time."
        actions={
          <div className="segmented">
            <button className={filter === 'open' ? 'is-active' : ''} onClick={() => setFilter('open')}>
              Open ({openCount})
            </button>
            <button className={filter === 'resolved' ? 'is-active' : ''} onClick={() => setFilter('resolved')}>
              Resolved
            </button>
            <button className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>
              All
            </button>
          </div>
        }
      />

      {list.length === 0 ? (
        <Panel>
          <EmptyState
            glyph="⚑"
            title={filter === 'open' ? 'No open mistakes' : 'Nothing here'}
            hint="When you miss a question in practice, use “add to mistake notebook” to capture it. Auto-filled with the trap and correct reasoning."
          >
            <Link to="/practice" className="btn btn--primary">
              ✦ Practice
            </Link>
          </EmptyState>
        </Panel>
      ) : (
        <div className="stack">
          {list.map((note) => (
            <MistakeCard key={note.questionId} note={note} question={qmap.get(note.questionId)} />
          ))}
        </div>
      )}
    </div>
  )
}
