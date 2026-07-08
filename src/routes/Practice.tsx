import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Question } from '../types'
import { useStore } from '../store/useStore'
import { useActiveQuestions, useModuleStats } from '../store/selectors'
import { weakestModules } from '../lib/analytics'
import { MODULES } from '../data/taxonomy'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { QuestionRunner } from '../components/question/QuestionRunner'

type Source = 'all' | 'module' | 'bookmarked' | 'weak'
type Diff = 'any' | 'easy' | 'medium' | 'hard'

function shuffle<T>(a: T[]): T[] {
  const arr = a.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function Practice() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const questions = useActiveQuestions()
  const mods = useModuleStats()
  const bookmarks = useStore((s) => s.bookmarks)

  const [source, setSource] = useState<Source>('all')
  const [moduleSel, setModuleSel] = useState<number>(1)
  const [difficulty, setDifficulty] = useState<Diff>('any')
  const [count, setCount] = useState<number>(20)

  const [queue, setQueue] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'setup' | 'run' | 'done'>('setup')
  const [correctCount, setCorrectCount] = useState(0)
  const started = useRef(false)

  const qmap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])

  const build = (src: Source, mod: number, diff: Diff, n: number): string[] => {
    let pool: Question[] = questions
    if (src === 'module') pool = pool.filter((q) => q.module === mod)
    else if (src === 'bookmarked') pool = pool.filter((q) => bookmarks.includes(q.id))
    else if (src === 'weak') {
      const weakSet = new Set(weakestModules(mods, 6).map((m) => m.module))
      pool = pool.filter((q) => weakSet.has(q.module))
    }
    if (diff !== 'any') pool = pool.filter((q) => q.difficulty === diff)
    return shuffle(pool)
      .slice(0, n)
      .map((q) => q.id)
  }

  const start = (src: Source, mod: number, diff: Diff, n: number) => {
    const ids = build(src, mod, diff, n)
    if (ids.length === 0) return
    setQueue(ids)
    setIdx(0)
    setCorrectCount(0)
    setPhase('run')
  }

  // deep-link autostart (from Dashboard: ?module=N or ?mode=weak)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const m = params.get('module')
    const mode = params.get('mode')
    if (mode === 'weak') {
      setSource('weak')
      start('weak', 1, 'any', 20)
    } else if (m) {
      const mn = Number(m)
      setSource('module')
      setModuleSel(mn)
      start('module', mn, 'any', 20)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onNext = (correct: boolean) => {
    if (correct) setCorrectCount((c) => c + 1)
    if (idx + 1 < queue.length) setIdx((i) => i + 1)
    else setPhase('done')
  }

  // ---- run phase ----
  if (phase === 'run') {
    const current = qmap.get(queue[idx])
    if (!current) {
      setPhase('done')
      return null
    }
    const progress = (idx / queue.length) * 100
    return (
      <div className="page" style={{ maxWidth: 860 }}>
        <div className="row row--between mb-2">
          <button className="btn btn--ghost btn--sm" onClick={() => setPhase('done')}>
            ✕ End session
          </button>
          <span className="term t-sm dim tabnum">
            {idx + 1} / {queue.length} · {correctCount} correct
          </span>
        </div>
        <div className="progressbar mb-3" style={{ height: 4 }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--neon-magenta), var(--border-cyan))',
            }}
          />
        </div>
        <Panel>
          <QuestionRunner
            key={current.id}
            question={current}
            mode="practice"
            index={idx}
            total={queue.length}
            onNext={onNext}
          />
        </Panel>
      </div>
    )
  }

  // ---- done phase ----
  if (phase === 'done') {
    const answered = correctCount + (queue.length - correctCount)
    const acc = queue.length ? Math.round((correctCount / queue.length) * 100) : 0
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Panel brackets pad="lg">
          <div className="center">
            <div className="page__eyebrow">Session complete</div>
            <div className="stat__value" style={{ fontSize: '3rem', color: acc >= 70 ? 'var(--acid-green)' : 'var(--warning-amber)' }}>
              {acc}%
            </div>
            <p className="muted">
              {correctCount} of {answered} correct
            </p>
            <div className="row center wrap mt-3" style={{ justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn--primary" onClick={() => setPhase('setup')}>
                ✦ New session
              </button>
              <button className="btn btn--ghost" onClick={() => navigate('/review')}>
                ↻ Go to review
              </button>
              <button className="btn btn--ghost" onClick={() => navigate('/')}>
                ◈ Dashboard
              </button>
            </div>
          </div>
        </Panel>
      </div>
    )
  }

  // ---- setup phase ----
  const previewCount = build(source, moduleSel, difficulty, 9999).length

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <PageHeader
        eyebrow="Training // Free Practice"
        title="Practice"
        sub="Answer with full explanations. Every question you touch enters your spaced-repetition queue."
      />

      <Panel>
        <div className="field">
          <label className="label">Source</label>
          <div className="segmented">
            {(['all', 'module', 'bookmarked', 'weak'] as Source[]).map((s) => (
              <button key={s} className={source === s ? 'is-active' : ''} onClick={() => setSource(s)}>
                {s === 'all' ? 'All' : s === 'module' ? 'Module' : s === 'bookmarked' ? 'Pinned' : 'Weak'}
              </button>
            ))}
          </div>
        </div>

        {source === 'module' && (
          <div className="field">
            <label className="label">Module</label>
            <select className="select" value={moduleSel} onChange={(e) => setModuleSel(Number(e.target.value))}>
              {MODULES.map((m) => (
                <option key={m.module} value={m.module}>
                  M{String(m.module).padStart(2, '0')} · {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label className="label">Difficulty</label>
          <div className="segmented">
            {(['any', 'easy', 'medium', 'hard'] as Diff[]).map((d) => (
              <button key={d} className={difficulty === d ? 'is-active' : ''} onClick={() => setDifficulty(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="label">Length</label>
          <div className="segmented">
            {[10, 20, 40, 9999].map((n) => (
              <button key={n} className={count === n ? 'is-active' : ''} onClick={() => setCount(n)}>
                {n === 9999 ? 'All' : n}
              </button>
            ))}
          </div>
        </div>

        <div className="row row--between mt-2 wrap">
          <span className="term t-sm dim">{previewCount} questions match — session of {Math.min(previewCount, count)}</span>
          <button className="btn btn--primary btn--lg" disabled={previewCount === 0} onClick={() => start(source, moduleSel, difficulty, count)}>
            Start practice →
          </button>
        </div>
        {previewCount === 0 && <p className="neon-amber t-sm mt-1">No questions match this filter — widen the scope.</p>}
      </Panel>
    </div>
  )
}
