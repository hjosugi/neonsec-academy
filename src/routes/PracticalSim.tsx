import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { PracticalKind, PracticalResult, Question } from '../types'
import { useStore } from '../store/useStore'
import { useActiveQuestions, useAllQuestionMap } from '../store/selectors'
import {
  PRACTICAL_COMPOSITION,
  PRACTICAL_KINDS,
  PRACTICAL_KIND_LABELS,
  PRACTICAL_PASS_PCT,
  PRACTICAL_PRESETS,
  PRACTICAL_SESSION_SIZE,
  createPracticalSession,
  isPracticalAnswered,
  practicalKind,
  practicalPoolStats,
  practicalResultToMarkdown,
  practicalSkills,
} from '../lib/practicalSim'
import { isFreeform } from '../lib/grade'
import { formatDateTime } from '../lib/format'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { Markdown } from '../components/ui/Markdown'

const KIND_GLYPH: Record<PracticalKind, string> = {
  'dataset-analysis': '≣',
  'config-review': '⚙',
  'concept-lab': '⧉',
  'report-prompt': '⎙',
}

function clock(totalSec: number): string {
  const sec = Math.max(0, totalSec)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function PracticalRunner({ onSubmitted }: { onSubmitted: (result: PracticalResult) => void }) {
  const session = useStore((s) => s.activePractical)!
  const practicalAnswer = useStore((s) => s.practicalAnswer)
  const practicalGoto = useStore((s) => s.practicalGoto)
  const cancelPractical = useStore((s) => s.cancelPractical)
  const submitPractical = useStore((s) => s.submitPractical)
  const qmap = useAllQuestionMap()
  const [now, setNow] = useState(() => Date.now())
  const [showModel, setShowModel] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const remaining = session.durationSec - Math.floor((now - session.startedAt) / 1000)
  const submit = () => {
    if (doneRef.current) return
    doneRef.current = true
    const result = submitPractical()
    if (result) onSubmitted(result)
  }

  useEffect(() => {
    if (remaining <= 0) submit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const questions = session.questionIds.map((id) => qmap.get(id)).filter(Boolean) as Question[]
  const question = questions[session.currentIndex]
  const answeredCount = questions.filter((q) => isPracticalAnswered(q, session.answers[q.id])).length
  const progressStyle = { '--v': `${Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%`, '--c': 'var(--acid-green)' } as CSSProperties

  useEffect(() => setShowModel(false), [session.currentIndex])

  if (!question) {
    return (
      <div className="page">
        <Panel>
          <p className="muted">This session references challenges that are no longer available.</p>
          <button className="btn btn--danger" onClick={cancelPractical}>Discard session</button>
        </Panel>
      </div>
    )
  }

  const answer = session.answers[question.id]
  const kind = practicalKind(question)
  const freeform = isFreeform(question)
  const chosen = typeof answer?.chosen === 'string' ? answer.chosen : ''

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>Practical Sim // {session.presetLabel}</>}
        title={`Challenge ${session.currentIndex + 1} / ${questions.length}`}
        actions={
          <>
            <span className={`badge ${remaining < 600 ? 'badge--red' : 'badge--cyan'}`} aria-live="polite">⏱ {clock(remaining)}</span>
            <button className="btn btn--green btn--sm" onClick={() => { if (window.confirm(`Submit with ${answeredCount}/${questions.length} answered?`)) submit() }}>
              Finish session
            </button>
          </>
        }
      />
      <div className="meter mb-2" style={progressStyle} aria-label={`${answeredCount} of ${questions.length} answered`}>
        <div className="meter__fill" />
      </div>
      <div className="row wrap mb-3" style={{ gap: '0.3rem' }} role="navigation" aria-label="Challenge navigator">
        {questions.map((q, index) => {
          const done = isPracticalAnswered(q, session.answers[q.id])
          const k = practicalKind(q)
          return (
            <button
              key={q.id}
              className={`chip ${index === session.currentIndex ? 'chip--active' : ''}`}
              style={done ? { borderColor: 'var(--acid-green)' } : undefined}
              onClick={() => practicalGoto(index)}
              aria-current={index === session.currentIndex}
              title={k ? PRACTICAL_KIND_LABELS[k] : undefined}
            >
              {k ? KIND_GLYPH[k] : '·'} {index + 1}{session.answers[q.id]?.unsure ? '?' : ''}
            </button>
          )
        })}
      </div>

      <Panel className="mb-3">
        <div className="row wrap mb-2" style={{ gap: '0.35rem' }}>
          {kind && <span className="badge badge--cyan">{PRACTICAL_KIND_LABELS[kind]}</span>}
          <span className="badge">M{question.module} {question.moduleName}</span>
          {practicalSkills(question).map((skill) => <span key={skill} className="badge badge--purple">{skill}</span>)}
        </div>
        <Markdown source={question.body} />

        {freeform ? (
          <div className="mt-3">
            <label className="label" htmlFor="practical-freeform">Your answer</label>
            <textarea
              id="practical-freeform"
              className="textarea"
              value={chosen}
              onChange={(e) => practicalAnswer(question.id, { chosen: e.target.value, selfCorrect: null })}
              placeholder="Write the finding: title, evidence, impact, remediation."
            />
            <div className="row wrap mt-2" style={{ gap: '0.4rem' }}>
              <button className="btn btn--ghost btn--sm" disabled={!chosen.trim()} onClick={() => setShowModel((v) => !v)}>
                {showModel ? 'Hide model answer' : 'Compare with model answer'}
              </button>
            </div>
            {showModel && (
              <div className="panel mt-2" style={{ background: 'var(--panel-inset)' }}>
                <div className="term t-xs dim mb-1">Model answer</div>
                <p className="t-sm muted">{String(question.answer)}</p>
                <div className="row wrap" style={{ gap: '0.4rem' }}>
                  <button className={`btn btn--sm ${answer?.selfCorrect === true ? 'btn--green' : 'btn--ghost'}`} onClick={() => practicalAnswer(question.id, { selfCorrect: true })}>
                    Mine covers it
                  </button>
                  <button className={`btn btn--sm ${answer?.selfCorrect === false ? 'btn--danger' : 'btn--ghost'}`} onClick={() => practicalAnswer(question.id, { selfCorrect: false })}>
                    Mine misses key points
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="stack stack--sm mt-3" role="radiogroup" aria-label="Answer choices">
            {(question.choices ?? []).map((choice) => (
              <button
                key={choice}
                role="radio"
                aria-checked={chosen === choice}
                className={`choice ${chosen === choice ? 'is-selected' : ''}`}
                onClick={() => practicalAnswer(question.id, { chosen: choice })}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        <label className="toggle mt-3">
          <input type="checkbox" checked={answer?.unsure === true} onChange={(e) => practicalAnswer(question.id, { unsure: e.target.checked })} />
          <span className="toggle__track" />
          <span className="t-sm">I'm unsure — schedule this for early review even if correct</span>
        </label>
      </Panel>

      <div className="row row--between wrap" style={{ gap: '0.5rem' }}>
        <button className="btn btn--ghost" disabled={session.currentIndex === 0} onClick={() => practicalGoto(session.currentIndex - 1)}>← Previous</button>
        <button className="btn btn--danger btn--sm" onClick={() => { if (window.confirm('Discard this practical session? Answers will be lost.')) cancelPractical() }}>
          Discard
        </button>
        <button className="btn btn--primary" disabled={session.currentIndex >= questions.length - 1} onClick={() => practicalGoto(session.currentIndex + 1)}>Next →</button>
      </div>
    </div>
  )
}

function ReadinessReport({ result }: { result: PracticalResult }) {
  const qmap = useAllQuestionMap()
  const scoreStyle = { '--v': `${result.scorePct}%`, '--c': result.passed ? 'var(--acid-green)' : 'var(--warning-amber)' } as CSSProperties
  const table = (rows: Array<{ label: string; correct: number; total: number; pct: number }>) => (
    <div className="scroll-x">
      <table className="table">
        <thead><tr><th>Area</th><th>Correct</th><th>%</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td className="tabnum">{row.correct}/{row.total}</td>
              <td><span className={`badge ${row.pct >= PRACTICAL_PASS_PCT ? 'badge--green' : 'badge--amber'}`}>{row.pct}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="stack">
      <Panel
        title="Practical readiness report"
        right={<span className={`badge ${result.passed ? 'badge--green' : 'badge--amber'}`}>{result.passed ? 'ready' : 'not yet'}</span>}
      >
        <div className="row row--between wrap" style={{ gap: '1rem' }}>
          <div>
            <div className="stat__value">{result.scorePct}%</div>
            <div className="stat__label">{result.correct}/{result.total} correct · pass {result.passPct}% · {result.presetLabel}</div>
          </div>
          <div className="term t-xs dim">
            {formatDateTime(result.completedAt)} · {Math.round(result.timeUsedSec / 60)}/{Math.round(result.durationSec / 60)} min · seed {result.seed}
          </div>
        </div>
        <div className="meter meter--tall mt-2" style={scoreStyle}><div className="meter__fill" /></div>
        <ul className="mt-3 t-sm muted" style={{ paddingLeft: '1.1rem' }}>
          {result.nextActions.map((action) => <li key={action}>{action}</li>)}
        </ul>
        <div className="row wrap" style={{ gap: '0.5rem' }}>
          <button className="btn btn--green btn--sm" onClick={() => download(`practical-readiness-${result.seed}.md`, practicalResultToMarkdown(result))}>⤓ Export Markdown</button>
          <Link className="btn btn--ghost btn--sm" to="/review">Open Review Queue →</Link>
        </div>
      </Panel>
      <div className="grid-2">
        <Panel title="By challenge type">{table(result.perKind.map((row) => ({ label: PRACTICAL_KIND_LABELS[row.kind], ...row })))}</Panel>
        <Panel title="By skill">{table(result.perSkill.map((row) => ({ label: row.skill, ...row })))}</Panel>
      </div>
      <Panel title="By CEH module">{table(result.perModule.map((row) => ({ label: `M${row.module} ${row.moduleName}`, ...row })))}</Panel>
      {(result.wrongIds.length > 0 || result.weakIds.length > 0) && (
        <Panel title="Wrong and weak challenges (queued for review)">
          <div className="stack stack--sm">
            {[...result.wrongIds.map((id) => [id, 'wrong'] as const), ...result.weakIds.map((id) => [id, 'unsure'] as const)].map(([id, label]) => (
              <Link key={`${id}-${label}`} to={`/bank/${encodeURIComponent(id)}`} className="row wrap" style={{ gap: '0.4rem' }}>
                <span className={`badge ${label === 'wrong' ? 'badge--red' : 'badge--amber'}`}>{label}</span>
                <span className="t-sm">{qmap.get(id)?.title ?? id}</span>
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

export function PracticalSim() {
  const active = useStore((s) => s.activePractical)
  const results = useStore((s) => s.practicalResults)
  const startPractical = useStore((s) => s.startPractical)
  const questions = useActiveQuestions()
  const stats = useMemo(() => practicalPoolStats(questions), [questions])
  const [selectedId, setSelectedId] = useState<string | null>(results[0]?.id ?? null)
  const [error, setError] = useState('')
  const selected = results.find((result) => result.id === selectedId) ?? null
  const poolSize = PRACTICAL_KINDS.reduce((sum, kind) => sum + stats[kind], 0)

  if (active) return <PracticalRunner onSubmitted={(result) => setSelectedId(result.id)} />

  const start = (durationMin: number, label: string) => {
    const session = createPracticalSession(questions, { durationMin, presetLabel: label })
    if (!session) {
      setError(`At least ${PRACTICAL_SESSION_SIZE} active practical challenges are required.`)
      return
    }
    setError('')
    startPractical(session)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Practical // CEH Practical-style Simulator"
        title="Practical Sim"
        sub="Twenty timed challenges mixing dataset analysis, config review, concept labs, and report prompts — all answered from synthetic artifacts."
      />

      <Panel className="mb-3" brackets>
        <p className="t-sm muted" style={{ marginTop: 0 }}>
          This simulator imitates only the <strong>format</strong> of a hands-on practical: a timer, 20 challenges, and a
          readiness report. It never asks you to scan, exploit, or connect to anything — every answer is in the provided
          synthetic artifact. Wrong and unsure challenges go to your Review Queue.
        </p>
        <div className="row wrap" style={{ gap: '0.35rem' }}>
          {PRACTICAL_KINDS.map((kind) => (
            <span key={kind} className="badge badge--cyan">
              {KIND_GLYPH[kind]} {PRACTICAL_KIND_LABELS[kind]}: {PRACTICAL_COMPOSITION[kind]} per session · {stats[kind]} in pool
            </span>
          ))}
        </div>
        <div className="grid-2 mt-3">
          {PRACTICAL_PRESETS.map((preset) => (
            <div key={preset.id} className="panel" style={{ background: 'var(--panel-inset)' }}>
              <div className="display t-sm">{preset.label}</div>
              <p className="term t-xs dim">{preset.description}</p>
              <button className="btn btn--primary btn--sm" disabled={poolSize < PRACTICAL_SESSION_SIZE} onClick={() => start(preset.durationMin, preset.label)}>
                Start {PRACTICAL_SESSION_SIZE} challenges →
              </button>
            </div>
          ))}
        </div>
        {error && <p className="term t-xs neon-red mt-2" role="alert">{error}</p>}
      </Panel>

      {results.length > 0 && (
        <>
          <div className="row wrap mb-2" style={{ gap: '0.3rem' }}>
            {results.map((result) => (
              <button
                key={result.id}
                className={`chip ${result.id === selectedId ? 'chip--active' : ''}`}
                onClick={() => setSelectedId(result.id)}
              >
                {formatDateTime(result.completedAt)} · {result.scorePct}%
              </button>
            ))}
          </div>
          {selected && <ReadinessReport result={selected} />}
        </>
      )}
    </div>
  )
}
