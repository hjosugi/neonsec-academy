import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CONCEPT_CARDS } from '../data/conceptCards'
import { DOMAINS, MODULES, moduleMeta } from '../data/taxonomy'
import { useAllQuestions } from '../store/selectors'
import { conceptCardsForQuestion, relatedQuestionsForCard } from '../lib/conceptCards'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

export function ConceptCards() {
  const { id } = useParams()
  const navigate = useNavigate()
  const questions = useAllQuestions()
  const [query, setQuery] = useState('')
  const [moduleF, setModuleF] = useState('all')
  const card = id ? CONCEPT_CARDS.find((item) => item.id === id) : undefined

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return CONCEPT_CARDS.filter((item) => {
      if (moduleF !== 'all' && String(item.module) !== moduleF) return false
      if (!term) return true
      const hay = `${item.title} ${item.tags.join(' ')} ${item.meaning} ${item.examTrap}`.toLowerCase()
      return hay.includes(term)
    })
  }, [moduleF, query])

  if (id && !card) {
    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <Panel>
          <EmptyState glyph="□" title="Card not found" hint="The concept card link is stale.">
            <button className="btn btn--primary" onClick={() => navigate('/cards')}>
              Back to cards
            </button>
          </EmptyState>
        </Panel>
      </div>
    )
  }

  if (card) {
    const meta = moduleMeta(card.module)
    const relatedQuestions = relatedQuestionsForCard(card, questions, 8)
    const siblingCards = CONCEPT_CARDS.filter((item) => item.module === card.module && item.id !== card.id).slice(0, 4)
    return (
      <div className="page">
        <PageHeader
          eyebrow={<>Concept // <span className="mono">{card.id}</span></>}
          title={card.title}
          actions={
            <button className="btn btn--ghost btn--sm" onClick={() => navigate('/cards')}>
              Cards
            </button>
          }
        />

        <div className="qconsole">
          <Panel>
            <div className="row wrap mb-2" style={{ gap: '0.4rem' }}>
              <span className="badge badge--cyan">M{String(card.module).padStart(2, '0')}</span>
              {meta && <span className="badge">{DOMAINS[meta.domain].short}</span>}
              {card.tags.map((tag) => (
                <span key={tag} className="chip">#{tag}</span>
              ))}
            </div>
            <div className="stack">
              <div>
                <div className="label">Meaning</div>
                <p className="t-sm">{card.meaning}</p>
              </div>
              <div>
                <div className="label">When Used</div>
                <p className="t-sm">{card.whenUsed}</p>
              </div>
              <div>
                <div className="label">Exam Trap</div>
                <p className="t-sm neon-amber">{card.examTrap}</p>
              </div>
              <div>
                <div className="label">Remember</div>
                <p className="display t-sm neon-cyan">{card.rememberPhrase}</p>
              </div>
            </div>
          </Panel>

          <div className="inspector">
            <Panel title="Related Questions">
              {relatedQuestions.length === 0 ? (
                <p className="muted t-sm">No related questions.</p>
              ) : (
                <div className="stack stack--sm">
                  {relatedQuestions.map((question) => {
                    const cards = conceptCardsForQuestion(question, CONCEPT_CARDS, 3)
                    return (
                      <button
                        key={question.id}
                        className="btn btn--ghost btn--block"
                        onClick={() => navigate(`/bank/${encodeURIComponent(question.id)}`)}
                      >
                        <span className="term t-xs dim">{question.id}</span>
                        <span style={{ display: 'block' }}>{question.title ?? question.body.slice(0, 72)}</span>
                        <span className="term t-xs dim" style={{ display: 'block' }}>
                          {cards.length} related card{cards.length === 1 ? '' : 's'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </Panel>

            <Panel title="Same Module">
              <div className="stack stack--sm">
                {siblingCards.map((item) => (
                  <button key={item.id} className="btn btn--ghost btn--block" onClick={() => navigate(`/cards/${item.id}`)}>
                    {item.title}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Content // Concept Cards"
        title="Concept Cards"
        sub={`${CONCEPT_CARDS.length} CEH cards across 20 modules.`}
        actions={
          <Link to="/practice?mode=weak&count=10" className="btn btn--primary btn--sm">
            Weak drill
          </Link>
        }
      />

      <Panel className="mb-3">
        <div className="row wrap" style={{ gap: '0.5rem' }}>
          <input
            className="input"
            style={{ maxWidth: 360 }}
            placeholder="Search concepts, traps, tags..."
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <select className="select" style={{ width: 'auto' }} value={moduleF} onChange={(event) => setModuleF(event.currentTarget.value)}>
            <option value="all">All modules</option>
            {MODULES.map((module) => (
              <option key={module.module} value={module.module}>
                M{String(module.module).padStart(2, '0')} · {module.short}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      <div className="row row--between mb-2">
        <span className="term t-sm dim">{filtered.length} cards</span>
      </div>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState glyph="□" title="No cards" hint="Clear the filters or search a broader term." />
        </Panel>
      ) : (
        <div className="stack stack--sm">
          {filtered.map((item) => {
            const meta = moduleMeta(item.module)
            return (
              <button
                key={item.id}
                className="neon-card"
                style={{ padding: '0.75rem 0.9rem' }}
                onClick={() => navigate(`/cards/${item.id}`)}
              >
                <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                  <div className="row wrap" style={{ gap: '0.4rem' }}>
                    <span className="badge badge--cyan">M{String(item.module).padStart(2, '0')}</span>
                    {meta && <span className="badge">{DOMAINS[meta.domain].short}</span>}
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="chip">#{tag}</span>
                    ))}
                  </div>
                  <span className="term t-xs dim">{item.id}</span>
                </div>
                <div className="display t-sm mt-1" style={{ color: 'var(--text-main)' }}>{item.title}</div>
                <div className="t-sm mt-1" style={{ color: 'var(--text-main)' }}>
                  {item.meaning}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
