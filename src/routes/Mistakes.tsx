import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MistakeNote, Question } from '../types'
import { useStore } from '../store/useStore'
import { useAllQuestionMap } from '../store/selectors'
import { DOMAINS } from '../data/taxonomy'
import { DAY, formatDate, startOfDay } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const FIELDS: { key: keyof MistakeNote; label: string }[] = [
  { key: 'whyWrong', label: 'Why I was wrong' },
  { key: 'correctReasoning', label: 'Correct reasoning' },
  { key: 'trapPattern', label: 'Trap pattern' },
  { key: 'reasoningGap', label: 'Reasoning gap' },
  { key: 'memoryPhrase', label: 'Memory phrase' },
  { key: 'nextAction', label: 'Next action' },
]

function needsNotes(note: MistakeNote): boolean {
  return [note.whyWrong, note.correctReasoning, note.memoryPhrase, note.nextAction].some((value) => value.trim() === '')
}

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
          {needsNotes(note) && <span className="badge badge--amber">needs notes</span>}
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
  const qmap = useAllQuestionMap()
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all')
  const [needsNotesOnly, setNeedsNotesOnly] = useState(false)

  const list = useMemo(() => {
    const arr = Object.values(mistakes).sort((a, b) => b.updatedAt - a.updatedAt)
    const now = Date.now()
    const since =
      dateFilter === 'today'
        ? startOfDay(now)
        : dateFilter === '7d'
          ? now - 7 * DAY
          : dateFilter === '30d'
            ? now - 30 * DAY
            : 0

    return arr.filter((note) => {
      const question = qmap.get(note.questionId)
      if (filter === 'open' && note.resolved) return false
      if (filter === 'resolved' && !note.resolved) return false
      if (needsNotesOnly && !needsNotes(note)) return false
      if (since > 0 && note.updatedAt < since) return false
      if (moduleFilter !== 'all') {
        if (!question) return false
        const moduleKey = question.module === 0 ? 'ceh-plus' : String(question.module)
        if (moduleKey !== moduleFilter) return false
      }
      if (tagFilter !== 'all' && !question?.tags.includes(tagFilter)) return false
      return true
    })
  }, [mistakes, filter, moduleFilter, tagFilter, dateFilter, needsNotesOnly, qmap])

  const moduleOptions = useMemo(() => {
    const mods = new Set<string>()
    Object.values(mistakes).forEach((note) => {
      const question = qmap.get(note.questionId)
      if (question) mods.add(question.module === 0 ? 'ceh-plus' : String(question.module))
    })
    return [...mods].sort((a, b) => (a === 'ceh-plus' ? 1 : b === 'ceh-plus' ? -1 : Number(a) - Number(b)))
  }, [mistakes, qmap])

  const tagOptions = useMemo(() => {
    const tags = new Set<string>()
    Object.values(mistakes).forEach((note) => qmap.get(note.questionId)?.tags.forEach((tag) => tags.add(tag)))
    return [...tags].sort()
  }, [mistakes, qmap])

  const openCount = Object.values(mistakes).filter((m) => !m.resolved).length
  const incompleteCount = Object.values(mistakes).filter(needsNotes).length

  return (
    <div className="page">
      <PageHeader
        eyebrow="Retention // Mistake Notebook"
        title="Mistakes"
        sub={`Turn every miss into a lesson. ${incompleteCount} note${incompleteCount === 1 ? '' : 's'} still need detail.`}
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

      <Panel title="Filters">
        <div className="grid-4" style={{ gap: '0.7rem' }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Module</label>
            <select className="select" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="all">All modules</option>
              {moduleOptions.map((module) => (
                <option key={module} value={module}>
                  {module === 'ceh-plus' ? 'CEH+' : `M${module}`}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Tag</label>
            <select className="select" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
              <option value="all">All tags</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label className="label">Updated</label>
            <select className="select" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}>
              <option value="all">Any time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <label className="row" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={needsNotesOnly} onChange={(e) => setNeedsNotesOnly(e.target.checked)} />
            <span className="term t-xs muted">Needs notes only</span>
          </label>
        </div>
      </Panel>

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
