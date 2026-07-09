import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DomainId, QType } from '../types'
import { useStore } from '../store/useStore'
import { useAllQuestions } from '../store/selectors'
import { DOMAINS, MODULES } from '../data/taxonomy'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const TYPES: QType[] = ['mcq', 'multi', 'true_false', 'short_answer', 'scenario', 'report_prompt']
const CAP = 120
const SAVED_FILTERS_KEY = 'neonsec:question-bank:filters'

type StatusFilter = 'active' | 'archived' | 'all'
type ResultFilter = 'all' | 'correct' | 'incorrect' | 'unattempted'

interface FilterSnapshot {
  q: string
  moduleF: string
  domainF: string
  diffF: string
  typeF: string
  statusF: StatusFilter
  resultF: ResultFilter
  selectedTags: string[]
  pinnedOnly: boolean
  unseenOnly: boolean
}

export function QuestionBank() {
  const navigate = useNavigate()
  const questions = useAllQuestions()
  const attempts = useStore((s) => s.attempts)
  const bookmarks = useStore((s) => s.bookmarks)
  const archivedIds = useStore((s) => s.archivedIds)

  const [q, setQ] = useState('')
  const [moduleF, setModuleF] = useState<string>('all')
  const [domainF, setDomainF] = useState<string>('all')
  const [diffF, setDiffF] = useState<string>('all')
  const [typeF, setTypeF] = useState<string>('all')
  const [statusF, setStatusF] = useState<StatusFilter>('active')
  const [resultF, setResultF] = useState<ResultFilter>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [unseenOnly, setUnseenOnly] = useState(false)

  const seenState = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const a of attempts) m.set(a.questionId, a.correct)
    return m
  }, [attempts])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const question of questions) {
      for (const tag of question.tags) tags.add(tag)
    }
    return [...tags].sort((a, b) => a.localeCompare(b)).slice(0, 200)
  }, [questions])

  const snapshot = (): FilterSnapshot => ({
    q,
    moduleF,
    domainF,
    diffF,
    typeF,
    statusF,
    resultF,
    selectedTags,
    pinnedOnly,
    unseenOnly,
  })

  const applySnapshot = (next: Partial<FilterSnapshot>) => {
    if (typeof next.q === 'string') setQ(next.q)
    if (typeof next.moduleF === 'string') setModuleF(next.moduleF)
    if (typeof next.domainF === 'string') setDomainF(next.domainF)
    if (typeof next.diffF === 'string') setDiffF(next.diffF)
    if (typeof next.typeF === 'string') setTypeF(next.typeF)
    if (next.statusF) setStatusF(next.statusF)
    if (next.resultF) setResultF(next.resultF)
    if (Array.isArray(next.selectedTags)) setSelectedTags(next.selectedTags.filter((t) => allTags.includes(t)))
    if (typeof next.pinnedOnly === 'boolean') setPinnedOnly(next.pinnedOnly)
    if (typeof next.unseenOnly === 'boolean') setUnseenOnly(next.unseenOnly)
  }

  const saveFilters = () => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(snapshot()))
  }

  const loadFilters = () => {
    if (typeof window === 'undefined') return
    const raw = window.localStorage.getItem(SAVED_FILTERS_KEY)
    if (!raw) return
    try {
      applySnapshot(JSON.parse(raw) as Partial<FilterSnapshot>)
    } catch {
      window.localStorage.removeItem(SAVED_FILTERS_KEY)
    }
  }

  const clearFilters = () => {
    applySnapshot({
      q: '',
      moduleF: 'all',
      domainF: 'all',
      diffF: 'all',
      typeF: 'all',
      statusF: 'active',
      resultF: 'all',
      selectedTags: [],
      pinnedOnly: false,
      unseenOnly: false,
    })
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const archived = new Set(archivedIds)
    return questions.filter((question) => {
      const isArchived = archived.has(question.id) || question.status === 'archived'
      if (statusF === 'active' && isArchived) return false
      if (statusF === 'archived' && !isArchived) return false
      if (moduleF !== 'all' && String(question.module) !== moduleF) return false
      if (domainF !== 'all' && question.domain !== domainF) return false
      if (diffF !== 'all' && question.difficulty !== diffF) return false
      if (typeF !== 'all' && question.type !== typeF) return false
      if (selectedTags.length > 0 && !selectedTags.every((tag) => question.tags.includes(tag))) return false
      if (pinnedOnly && !bookmarks.includes(question.id)) return false
      if (unseenOnly && seenState.has(question.id)) return false
      const last = seenState.get(question.id)
      if (resultF === 'correct' && last !== true) return false
      if (resultF === 'incorrect' && last !== false) return false
      if (resultF === 'unattempted' && seenState.has(question.id)) return false
      if (term) {
        const hay = ((question.title ?? '') + ' ' + question.body + ' ' + question.tags.join(' ') + ' ' + question.moduleName).toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [questions, q, moduleF, domainF, diffF, typeF, statusF, resultF, selectedTags, pinnedOnly, unseenOnly, bookmarks, seenState, archivedIds])

  const shown = filtered.slice(0, CAP)

  return (
    <div className="page">
      <PageHeader
        eyebrow="Content // Question Bank"
        title="Question Bank"
        sub="Every CEH module plus CEH+ practical items. Search, filter, and author your own."
        actions={
          <Link to="/bank/new" className="btn btn--primary btn--sm">
            ＋ New question
          </Link>
        }
      />

      <Panel className="mb-3">
        <div className="field" style={{ marginBottom: '0.7rem' }}>
          <input
            className="input"
            placeholder="⌕  Search body, tags, module…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="row wrap" style={{ gap: '0.5rem' }}>
          <select className="select" style={{ width: 'auto' }} value={moduleF} onChange={(e) => setModuleF(e.target.value)}>
            <option value="all">All modules</option>
            <option value="0">CEH+ Practical</option>
            {MODULES.map((m) => (
              <option key={m.module} value={m.module}>
                M{String(m.module).padStart(2, '0')} · {m.short}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={domainF} onChange={(e) => setDomainF(e.target.value)}>
            <option value="all">All domains</option>
            {(Object.keys(DOMAINS) as DomainId[]).map((d) => (
              <option key={d} value={d}>
                {DOMAINS[d].short}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={diffF} onChange={(e) => setDiffF(e.target.value)}>
            <option value="all">Any difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select className="select" style={{ width: 'auto' }} value={typeF} onChange={(e) => setTypeF(e.target.value)}>
            <option value="all">Any type</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={statusF} onChange={(e) => setStatusF(e.target.value as StatusFilter)}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All status</option>
          </select>
          <select className="select" style={{ width: 'auto' }} value={resultF} onChange={(e) => setResultF(e.target.value as ResultFilter)}>
            <option value="all">Any result</option>
            <option value="correct">Last correct</option>
            <option value="incorrect">Last incorrect</option>
            <option value="unattempted">Unattempted</option>
          </select>
          <select
            className="select"
            style={{ width: 'auto' }}
            value=""
            onChange={(e) => {
              const tag = e.target.value
              if (tag && !selectedTags.includes(tag)) setSelectedTags((prev) => [...prev, tag])
            }}
          >
            <option value="">Add tag filter</option>
            {allTags
              .filter((tag) => !selectedTags.includes(tag))
              .map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
          </select>
          <button className={`chip ${pinnedOnly ? 'chip--active' : ''}`} onClick={() => setPinnedOnly((v) => !v)}>
            ★ pinned
          </button>
          <button className={`chip ${unseenOnly ? 'chip--active' : ''}`} onClick={() => setUnseenOnly((v) => !v)}>
            ◌ unseen
          </button>
          <button className="btn btn--ghost btn--sm" onClick={saveFilters}>
            Save filters
          </button>
          <button className="btn btn--ghost btn--sm" onClick={loadFilters}>
            Load saved
          </button>
          <button className="btn btn--ghost btn--sm" onClick={clearFilters}>
            Clear
          </button>
        </div>
        {selectedTags.length > 0 && (
          <div className="row wrap mt-2" style={{ gap: '0.4rem' }}>
            {selectedTags.map((tag) => (
              <span key={tag} className="chip chip--active">
                #{tag}
                <button onClick={() => setSelectedTags((prev) => prev.filter((item) => item !== tag))}>×</button>
              </span>
            ))}
          </div>
        )}
      </Panel>

      <div className="row row--between mb-2">
        <span className="term t-sm dim">
          {filtered.length} result{filtered.length === 1 ? '' : 's'}
          {filtered.length > CAP ? ` · showing first ${CAP}` : ''}
        </span>
      </div>

      {shown.length === 0 ? (
        <Panel>
          <EmptyState glyph="⌕" title="No matches" hint="Loosen the filters or clear your search." />
        </Panel>
      ) : (
        <div className="stack stack--sm">
          {shown.map((question) => {
            const seen = seenState.has(question.id)
            const wasCorrect = seenState.get(question.id)
            const isArchived = archivedIds.includes(question.id) || question.status === 'archived'
            return (
              <button
                key={question.id}
                className="neon-card"
                style={{ padding: '0.7rem 0.9rem' }}
                onClick={() => navigate(`/bank/${encodeURIComponent(question.id)}`)}
              >
                <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                  <div className="row wrap" style={{ gap: '0.4rem' }}>
                    <span className="badge badge--cyan">
                      {question.module === 0 ? 'CEH+' : `M${String(question.module).padStart(2, '0')}`}
                    </span>
                    <span className="badge">{DOMAINS[question.domain].short}</span>
                    <span className={`diff diff--${question.difficulty}`}>◆ {question.difficulty}</span>
                    <span className="term t-xs dim">{question.type}</span>
                    {isArchived && <span className="badge badge--amber">archived</span>}
                  </div>
                  <div className="row" style={{ gap: '0.35rem' }}>
                    {bookmarks.includes(question.id) && <span className="neon-magenta">★</span>}
                    {seen ? (
                      <span className={wasCorrect ? 'neon-green' : 'neon-red'}>{wasCorrect ? '✔' : '✘'}</span>
                    ) : (
                      <span className="dim">◌</span>
                    )}
                  </div>
                </div>
                {question.title && (
                  <div className="display t-sm mt-1" style={{ color: 'var(--text-main)' }}>
                    {question.title}
                  </div>
                )}
                <div className="t-sm mt-1" style={{ color: 'var(--text-main)' }}>
                  {question.body.length > 150 ? question.body.slice(0, 148) + '…' : question.body}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
