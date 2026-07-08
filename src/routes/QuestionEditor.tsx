import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { Difficulty, QType, Question, RawQuestion, TrackKey } from '../types'
import { useStore } from '../store/useStore'
import { useQuestionMap } from '../store/selectors'
import { MODULES, TRACKS } from '../data/taxonomy'
import { uid } from '../lib/id'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Markdown } from '../components/ui/Markdown'

interface Draft {
  id: string
  type: QType
  module: number
  track: TrackKey | null
  difficulty: Difficulty
  tags: string
  body: string
  choices: string[]
  answerSingle: string
  answerMulti: string[]
  answerText: string
  explanation: { answer: string; why: string; trap: string; memory_phrase: string }
}

function fromQuestion(q: Question | RawQuestion, keepId: boolean): Draft {
  const arrAns = Array.isArray(q.answer) ? q.answer : []
  return {
    id: keepId ? q.id : `Q-USER-${uid()}`,
    type: q.type,
    module: q.module,
    track: q.track ?? null,
    difficulty: q.difficulty,
    tags: q.tags.join(', '),
    body: q.body,
    choices: q.choices ?? ['', '', '', ''],
    answerSingle: !Array.isArray(q.answer) ? q.answer : '',
    answerMulti: arrAns,
    answerText: q.type === 'scenario' && !Array.isArray(q.answer) ? q.answer : '',
    explanation: { ...q.explanation },
  }
}

const blank: Draft = {
  id: `Q-USER-${uid()}`,
  type: 'mcq',
  module: 1,
  track: null,
  difficulty: 'medium',
  tags: '',
  body: '',
  choices: ['', '', '', ''],
  answerSingle: '',
  answerMulti: [],
  answerText: '',
  explanation: { answer: '', why: '', trap: '', memory_phrase: '' },
}

export function QuestionEditor() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const qmap = useQuestionMap()
  const upsert = useStore((s) => s.upsertUserQuestion)

  const initial = useMemo<Draft>(() => {
    if (id && qmap.has(id)) return fromQuestion(qmap.get(id)!, true)
    const prefill = (location.state as { prefill?: Question } | null)?.prefill
    if (prefill) return fromQuestion(prefill, false)
    return { ...blank, id: `Q-USER-${uid()}` }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const [d, setD] = useState<Draft>(initial)
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }))
  const isEdit = !!(id && qmap.has(id))

  const choicesForType = d.type === 'true_false' ? ['True', 'False'] : d.choices

  const errors: string[] = []
  if (!d.body.trim()) errors.push('Question body is required.')
  if (!d.explanation.answer.trim()) errors.push('Explanation → answer is required.')
  if (d.type === 'mcq') {
    if (choicesForType.filter((c) => c.trim()).length < 2) errors.push('Add at least 2 choices.')
    if (!d.answerSingle) errors.push('Select the correct choice.')
  }
  if (d.type === 'multi') {
    if (d.choices.filter((c) => c.trim()).length < 3) errors.push('Multi-select needs at least 3 choices.')
    if (d.answerMulti.length < 2) errors.push('Mark at least 2 correct choices.')
  }
  if (d.type === 'true_false' && !d.answerSingle) errors.push('Choose True or False.')
  if (d.type === 'scenario' && !d.answerText.trim()) errors.push('Provide a model answer.')
  if (d.module === 0 && !d.track) errors.push('Pick a CEH+ track.')

  const build = (): RawQuestion => {
    const tags = d.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
    const base: RawQuestion = {
      id: d.id,
      type: d.type,
      module: d.module,
      track: d.module === 0 ? d.track : null,
      difficulty: d.difficulty,
      tags: tags.length ? tags : ['custom'],
      body: d.body.trim(),
      answer: '',
      explanation: d.explanation,
      source: 'user',
      status: 'active',
    }
    if (d.type === 'scenario') {
      base.answer = d.answerText.trim()
    } else if (d.type === 'multi') {
      base.choices = d.choices.filter((c) => c.trim())
      base.answer = d.answerMulti
    } else if (d.type === 'true_false') {
      base.choices = ['True', 'False']
      base.answer = d.answerSingle
    } else {
      base.choices = d.choices.filter((c) => c.trim())
      base.answer = d.answerSingle
    }
    return base
  }

  const save = () => {
    if (errors.length) return
    upsert(build())
    navigate(`/bank/${encodeURIComponent(d.id)}`)
  }

  const preview = build()

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <PageHeader
        eyebrow="Content // Author"
        title={isEdit ? 'Edit Question' : 'New Question'}
        sub="Author safe, knowledge-focused CEH questions. Synthetic scenarios only — no real targets."
        actions={
          <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>
            ← Cancel
          </button>
        }
      />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Panel title="Editor">
          <div className="row wrap" style={{ gap: '0.6rem' }}>
            <div className="field grow">
              <label className="label">Type</label>
              <select className="select" value={d.type} onChange={(e) => set({ type: e.target.value as QType })}>
                <option value="mcq">Multiple choice</option>
                <option value="multi">Multi-select</option>
                <option value="true_false">True / False</option>
                <option value="scenario">Scenario (self-graded)</option>
              </select>
            </div>
            <div className="field grow">
              <label className="label">Module</label>
              <select className="select" value={d.module} onChange={(e) => set({ module: Number(e.target.value) })}>
                <option value={0}>CEH+ Practical</option>
                {MODULES.map((m) => (
                  <option key={m.module} value={m.module}>
                    M{String(m.module).padStart(2, '0')} · {m.short}
                  </option>
                ))}
              </select>
            </div>
            <div className="field grow">
              <label className="label">Difficulty</label>
              <select className="select" value={d.difficulty} onChange={(e) => set({ difficulty: e.target.value as Difficulty })}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {d.module === 0 && (
            <div className="field">
              <label className="label">CEH+ Track</label>
              <select className="select" value={d.track ?? ''} onChange={(e) => set({ track: (e.target.value || null) as TrackKey | null })}>
                <option value="">— pick a track —</option>
                {Object.values(TRACKS).map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label className="label">Question body</label>
            <textarea className="textarea" value={d.body} onChange={(e) => set({ body: e.target.value })} placeholder="What does…" />
          </div>

          <div className="field">
            <label className="label">Tags (comma separated)</label>
            <input className="input" value={d.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="recon, passive" />
          </div>

          {(d.type === 'mcq' || d.type === 'multi') && (
            <div className="field">
              <label className="label">Choices — {d.type === 'multi' ? 'tick all correct' : 'select the correct one'}</label>
              {d.choices.map((c, i) => (
                <div className="row mb-1" key={i} style={{ gap: '0.5rem' }}>
                  {d.type === 'multi' ? (
                    <input
                      type="checkbox"
                      checked={d.answerMulti.includes(c) && !!c}
                      onChange={(e) =>
                        set({
                          answerMulti: e.target.checked
                            ? [...d.answerMulti.filter((x) => x !== c), c]
                            : d.answerMulti.filter((x) => x !== c),
                        })
                      }
                    />
                  ) : (
                    <input type="radio" name="answer" checked={d.answerSingle === c && !!c} onChange={() => set({ answerSingle: c })} />
                  )}
                  <input
                    className="input"
                    value={c}
                    onChange={(e) => {
                      const choices = [...d.choices]
                      const old = choices[i]
                      choices[i] = e.target.value
                      // keep answer refs in sync with edited text
                      set({
                        choices,
                        answerSingle: d.answerSingle === old ? e.target.value : d.answerSingle,
                        answerMulti: d.answerMulti.map((x) => (x === old ? e.target.value : x)),
                      })
                    }}
                    placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                  />
                  {d.choices.length > 2 && (
                    <button className="btn btn--ghost btn--sm" onClick={() => set({ choices: d.choices.filter((_, j) => j !== i) })}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {d.choices.length < 6 && (
                <button className="btn btn--ghost btn--sm" onClick={() => set({ choices: [...d.choices, ''] })}>
                  ＋ Add choice
                </button>
              )}
            </div>
          )}

          {d.type === 'true_false' && (
            <div className="field">
              <label className="label">Correct answer</label>
              <div className="segmented">
                {['True', 'False'].map((v) => (
                  <button key={v} className={d.answerSingle === v ? 'is-active' : ''} onClick={() => set({ answerSingle: v })}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {d.type === 'scenario' && (
            <div className="field">
              <label className="label">Model answer</label>
              <textarea className="textarea" value={d.answerText} onChange={(e) => set({ answerText: e.target.value })} />
            </div>
          )}

          <div className="divider" />
          <div className="field">
            <label className="label">Explanation · answer</label>
            <textarea className="textarea" style={{ minHeight: 60 }} value={d.explanation.answer} onChange={(e) => set({ explanation: { ...d.explanation, answer: e.target.value } })} />
          </div>
          <div className="field">
            <label className="label">Explanation · why</label>
            <textarea className="textarea" style={{ minHeight: 60 }} value={d.explanation.why} onChange={(e) => set({ explanation: { ...d.explanation, why: e.target.value } })} />
          </div>
          <div className="row wrap" style={{ gap: '0.6rem' }}>
            <div className="field grow">
              <label className="label">Trap</label>
              <input className="input" value={d.explanation.trap} onChange={(e) => set({ explanation: { ...d.explanation, trap: e.target.value } })} />
            </div>
            <div className="field grow">
              <label className="label">Memory phrase</label>
              <input className="input" value={d.explanation.memory_phrase} onChange={(e) => set({ explanation: { ...d.explanation, memory_phrase: e.target.value } })} />
            </div>
          </div>
        </Panel>

        <div className="inspector">
          <Panel title="Live Preview">
            <div className="qbody mb-2">
              <Markdown source={d.body || '_Question body…_'} />
            </div>
            {(preview.choices ?? []).map((c, i) => (
              <div key={i} className={`choice ${(Array.isArray(preview.answer) ? preview.answer.includes(c) : preview.answer === c) ? 'is-correct' : ''}`} style={{ cursor: 'default' }}>
                <span className="choice__key">{String.fromCharCode(65 + i)}</span>
                <span>{c || '…'}</span>
              </div>
            ))}
            {d.type === 'scenario' && <p className="muted t-sm">{d.answerText || 'Model answer…'}</p>}
          </Panel>

          {errors.length > 0 ? (
            <Panel title="Checklist">
              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                {errors.map((e, i) => (
                  <li key={i} className="neon-amber t-sm">
                    {e}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : (
            <Panel title="Ready">
              <p className="neon-green t-sm">✓ Passes validation.</p>
            </Panel>
          )}

          <button className="btn btn--primary btn--block" disabled={errors.length > 0} onClick={save}>
            {isEdit ? 'Save changes' : 'Add to my bank'}
          </button>
        </div>
      </div>
    </div>
  )
}
