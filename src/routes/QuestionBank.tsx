import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DomainId, QType } from '../types'
import { useStore } from '../store/useStore'
import { useActiveQuestions } from '../store/selectors'
import { DOMAINS, MODULES } from '../data/taxonomy'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const TYPES: QType[] = ['mcq', 'multi', 'true_false', 'scenario']
const CAP = 120

export function QuestionBank() {
  const navigate = useNavigate()
  const questions = useActiveQuestions()
  const attempts = useStore((s) => s.attempts)
  const bookmarks = useStore((s) => s.bookmarks)

  const [q, setQ] = useState('')
  const [moduleF, setModuleF] = useState<string>('all')
  const [domainF, setDomainF] = useState<string>('all')
  const [diffF, setDiffF] = useState<string>('all')
  const [typeF, setTypeF] = useState<string>('all')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const [unseenOnly, setUnseenOnly] = useState(false)

  const seenState = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const a of attempts) m.set(a.questionId, a.correct)
    return m
  }, [attempts])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return questions.filter((question) => {
      if (moduleF !== 'all' && String(question.module) !== moduleF) return false
      if (domainF !== 'all' && question.domain !== domainF) return false
      if (diffF !== 'all' && question.difficulty !== diffF) return false
      if (typeF !== 'all' && question.type !== typeF) return false
      if (pinnedOnly && !bookmarks.includes(question.id)) return false
      if (unseenOnly && seenState.has(question.id)) return false
      if (term) {
        const hay = (question.body + ' ' + question.tags.join(' ') + ' ' + question.moduleName).toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [questions, q, moduleF, domainF, diffF, typeF, pinnedOnly, unseenOnly, bookmarks, seenState])

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
          <button className={`chip ${pinnedOnly ? 'chip--active' : ''}`} onClick={() => setPinnedOnly((v) => !v)}>
            ★ pinned
          </button>
          <button className={`chip ${unseenOnly ? 'chip--active' : ''}`} onClick={() => setUnseenOnly((v) => !v)}>
            ◌ unseen
          </button>
        </div>
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
