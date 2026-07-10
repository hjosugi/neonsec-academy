import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type {
  DrillDifficulty,
  DrillFilterSnapshot,
  DrillQuestionType,
  DrillResult,
  DrillSource,
  TrackKey,
} from '../types'
import { useStore } from '../store/useStore'
import { useActiveQuestions, useModuleStats } from '../store/selectors'
import { weakestModules } from '../lib/analytics'
import { buildDrillQueue, DRILL_LENGTHS, recentQuestionIds } from '../lib/drill'
import { uid } from '../lib/id'
import { MODULES, TRACKS } from '../data/taxonomy'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { QuestionRunner } from '../components/question/QuestionRunner'

type DrillSessionMeta = DrillFilterSnapshot & {
  createdAt: number
  available: number
  freshAvailable: number
  fallbackUsed: boolean
}

const QUESTION_TYPES: DrillQuestionType[] = ['any', 'mcq', 'multi', 'true_false', 'scenario', 'short_answer', 'report_prompt']

const TYPE_LABEL: Record<DrillQuestionType, string> = {
  any: 'Any',
  mcq: 'MCQ',
  multi: 'Multi',
  true_false: 'True/False',
  scenario: 'Scenario',
  short_answer: 'Short',
  report_prompt: 'Report',
}

export function Practice() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const questions = useActiveQuestions()
  const mods = useModuleStats()
  const bookmarks = useStore((s) => s.bookmarks)
  const attempts = useStore((s) => s.attempts)
  const saveDrillResult = useStore((s) => s.saveDrillResult)

  const [source, setSource] = useState<DrillSource>('all')
  const [moduleSel, setModuleSel] = useState<number>(1)
  const [trackSel, setTrackSel] = useState<TrackKey>('pentest')
  const [difficulty, setDifficulty] = useState<DrillDifficulty>('any')
  const [questionType, setQuestionType] = useState<DrillQuestionType>('any')
  const [tagSel, setTagSel] = useState('any')
  const [count, setCount] = useState<number>(20)

  const [queue, setQueue] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<'setup' | 'run' | 'done'>('setup')
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionMeta, setSessionMeta] = useState<DrillSessionMeta | null>(null)
  const [lastDrill, setLastDrill] = useState<DrillResult | null>(null)
  const started = useRef(false)
  const answers = useRef<Array<{ questionId: string; correct: boolean }>>([])

  const qmap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])
  const tagOptions = useMemo(() => Array.from(new Set(questions.flatMap((q) => q.tags))).sort(), [questions])
  const weakModuleIds = useMemo(() => weakestModules(mods, 6).map((m) => m.module), [mods])
  const recentIds = useMemo(() => recentQuestionIds(attempts, 30), [attempts])

  const build = (
    src: DrillSource,
    mod: number,
    trk: TrackKey,
    diff: DrillDifficulty,
    qType: DrillQuestionType,
    tag: string,
    n: number,
    seed = Date.now(),
  ) => {
    return buildDrillQueue(questions, {
      source: src,
      module: mod,
      track: trk,
      difficulty: diff,
      type: qType,
      tag,
      count: n,
      bookmarks,
      weakModules: weakModuleIds,
      recentQuestionIds: recentIds,
      seed,
    })
  }

  const start = (
    src: DrillSource,
    mod: number,
    trk: TrackKey,
    diff: DrillDifficulty,
    qType: DrillQuestionType,
    tag: string,
    n: number,
  ) => {
    const createdAt = Date.now()
    const built = build(src, mod, trk, diff, qType, tag, n, createdAt)
    const ids = built.questionIds
    if (ids.length === 0) return
    setQueue(ids)
    setIdx(0)
    setCorrectCount(0)
    setLastDrill(null)
    setSessionMeta({
      source: src,
      module: src === 'module' ? mod : undefined,
      track: src === 'track' ? trk : undefined,
      tag: tag === 'any' ? null : tag,
      type: qType,
      difficulty: diff,
      requestedCount: n,
      createdAt,
      available: built.available,
      freshAvailable: built.freshAvailable,
      fallbackUsed: built.fallbackUsed,
    })
    answers.current = []
    setPhase('run')
  }

  // deep-link autostart (from Dashboard/City Map/Beyond: ?module=N, ?track=key, ?mode=weak)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const m = params.get('module')
    const trk = params.get('track') as TrackKey | null
    const mode = params.get('mode')
    const n = DRILL_LENGTHS.includes(Number(params.get('count')) as (typeof DRILL_LENGTHS)[number])
      ? Number(params.get('count'))
      : 20
    if (mode === 'weak') {
      setSource('weak')
      setCount(n)
      start('weak', 1, 'pentest', 'any', 'any', 'any', n)
    } else if (trk && TRACKS[trk]) {
      setSource('track')
      setTrackSel(trk)
      setCount(n)
      start('track', 1, trk, 'any', 'any', 'any', n)
    } else if (m) {
      const mn = Number(m)
      setSource('module')
      setModuleSel(mn)
      setCount(n)
      start('module', mn, 'pentest', 'any', 'any', 'any', n)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completeDrill = (nextAnswers = answers.current) => {
    if (nextAnswers.length === 0) {
      setLastDrill(null)
      setPhase('done')
      return
    }
    const nextCorrect = nextAnswers.filter((a) => a.correct).length
    const completedAt = Date.now()
    const filters: DrillFilterSnapshot = sessionMeta
      ? {
          source: sessionMeta.source,
          module: sessionMeta.module,
          track: sessionMeta.track,
          tag: sessionMeta.tag,
          type: sessionMeta.type,
          difficulty: sessionMeta.difficulty,
          requestedCount: sessionMeta.requestedCount,
        }
      : {
          source,
          module: source === 'module' ? moduleSel : undefined,
          track: source === 'track' ? trackSel : undefined,
          tag: tagSel === 'any' ? null : tagSel,
          type: questionType,
          difficulty,
          requestedCount: count,
        }
    const result: DrillResult = {
      id: uid('drill-'),
      createdAt: sessionMeta?.createdAt ?? completedAt,
      completedAt,
      filters,
      questionIds: nextAnswers.map((a) => a.questionId),
      total: nextAnswers.length,
      correct: nextCorrect,
      accuracyPct: Math.round((nextCorrect / nextAnswers.length) * 100),
    }
    saveDrillResult(result)
    setCorrectCount(nextCorrect)
    setLastDrill(result)
    setPhase('done')
  }

  const onNext = (correct: boolean) => {
    const currentId = queue[idx]
    const nextAnswers = currentId ? [...answers.current, { questionId: currentId, correct }] : answers.current
    answers.current = nextAnswers
    const nextCorrect = nextAnswers.filter((a) => a.correct).length
    setCorrectCount(nextCorrect)
    if (idx + 1 < queue.length) setIdx((i) => i + 1)
    else completeDrill(nextAnswers)
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
          <button className="btn btn--ghost btn--sm" onClick={() => completeDrill()}>
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
            attemptMode="drill"
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
    const answered = lastDrill?.total ?? queue.length
    const acc = lastDrill?.accuracyPct ?? (queue.length ? Math.round((correctCount / queue.length) * 100) : 0)
    const correctShown = lastDrill?.correct ?? correctCount
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Panel brackets pad="lg">
          <div className="center">
            <div className="page__eyebrow">Session complete</div>
            <div className="stat__value" style={{ fontSize: '3rem', color: acc >= 70 ? 'var(--acid-green)' : 'var(--warning-amber)' }}>
              {acc}%
            </div>
            <p className="muted">
              {correctShown} of {answered} correct
            </p>
            {lastDrill ? (
              <p className="term t-xs dim mt-1">
                Saved as drill result. Attempts already updated Review Queue and Analytics.
              </p>
            ) : (
              <p className="term t-xs dim mt-1">No answered items were saved.</p>
            )}
            <div className="row center wrap mt-3" style={{ justifyContent: 'center', gap: '0.5rem' }}>
              <button className="btn btn--primary" onClick={() => setPhase('setup')}>
                ✦ New drill
              </button>
              <button
                className="btn btn--ghost"
                onClick={() => start(source, moduleSel, trackSel, difficulty, questionType, tagSel, count)}
              >
                ↯ Repeat filters
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
  const preview = build(source, moduleSel, trackSel, difficulty, questionType, tagSel, 9999, 1)
  const previewCount = preview.available

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <PageHeader
        eyebrow="Training // Focus Drill"
        title="Practice"
        sub="Build a short drill by weak module, tag, type, and difficulty. Every answer updates review and analytics."
      />

      <Panel>
        <div className="field">
          <label className="label">Source</label>
          <div className="segmented">
            {(['all', 'module', 'track', 'bookmarked', 'weak'] as DrillSource[]).map((s) => (
              <button key={s} className={source === s ? 'is-active' : ''} onClick={() => setSource(s)}>
                {s === 'all' ? 'All' : s === 'module' ? 'Module' : s === 'track' ? 'CEH+' : s === 'bookmarked' ? 'Pinned' : 'Weak'}
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

        {source === 'track' && (
          <div className="field">
            <label className="label">CEH+ Track</label>
            <select className="select" value={trackSel} onChange={(e) => setTrackSel(e.target.value as TrackKey)}>
              {Object.values(TRACKS).map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label className="label">Difficulty</label>
          <div className="segmented">
            {(['any', 'easy', 'medium', 'hard'] as DrillDifficulty[]).map((d) => (
              <button key={d} className={difficulty === d ? 'is-active' : ''} onClick={() => setDifficulty(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label className="label">Question Type</label>
            <select className="select" value={questionType} onChange={(e) => setQuestionType(e.target.value as DrillQuestionType)}>
              {QUESTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TYPE_LABEL[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Tag</label>
            <select className="select" value={tagSel} onChange={(e) => setTagSel(e.target.value)}>
              <option value="any">Any tag</option>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label">Length</label>
          <div className="segmented">
            {DRILL_LENGTHS.map((n) => (
              <button key={n} className={count === n ? 'is-active' : ''} onClick={() => setCount(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="row row--between mt-2 wrap">
          <span className="term t-sm dim">
            {previewCount} match · {preview.freshAvailable} fresh · drill of {Math.min(previewCount, count)}
          </span>
          <button
            className="btn btn--primary btn--lg"
            disabled={previewCount === 0}
            onClick={() => start(source, moduleSel, trackSel, difficulty, questionType, tagSel, count)}
          >
            Start drill →
          </button>
        </div>
        {previewCount > 0 && preview.freshAvailable < Math.min(previewCount, count) && (
          <p className="neon-amber t-sm mt-1">Fresh pool is short; the drill may reuse older questions after fresh items.</p>
        )}
        {previewCount === 0 && <p className="neon-amber t-sm mt-1">No questions match this filter — widen the scope.</p>}
      </Panel>
    </div>
  )
}
