import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { InterviewStory, TrackKey } from '../types'
import { useStore } from '../store/useStore'
import { useActiveQuestions, useDomainStats, useModuleStats } from '../store/selectors'
import { LABS } from '../data/labs'
import { TRACK_CHALLENGES } from '../data/tracks'
import {
  blankStory,
  honestGapStatement,
  memoLengthStatus,
  skillEvidence,
  speakingSeconds,
  storyComplete,
  type SkillEvidence,
} from '../lib/interview'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

const STATUS_CLASS = { strong: 'badge--green', developing: 'badge--amber', gap: 'badge--red' } as const

function StoryEditor({ story, onClose }: { story: InterviewStory; onClose: () => void }) {
  const upsertStory = useStore((s) => s.upsertStory)
  const deleteStory = useStore((s) => s.deleteStory)
  const [draft, setDraft] = useState(story)
  const [saved, setSaved] = useState(false)
  const patch = (p: Partial<InterviewStory>) => {
    setDraft((current) => ({ ...current, ...p }))
    setSaved(false)
  }
  const memoStatus = memoLengthStatus(draft.memo)
  const seconds = speakingSeconds(draft.memo)
  const field = (key: 'situation' | 'task' | 'action' | 'result', label: string, placeholder: string) => (
    <div className="field" key={key}>
      <label className="label" htmlFor={`story-${key}`}>{label}</label>
      <textarea id={`story-${key}`} className="textarea" style={{ minHeight: 52 }} value={draft[key]} placeholder={placeholder} onChange={(e) => patch({ [key]: e.target.value })} />
    </div>
  )

  return (
    <Panel title={draft.kind === 'gap' ? 'Honest gap story' : 'Skill story'} right={<span className={`badge ${storyComplete(draft) ? 'badge--green' : 'badge--amber'}`}>{storyComplete(draft) ? 'complete' : 'draft'}</span>}>
      <div className="field">
        <label className="label" htmlFor="story-title">Title</label>
        <input id="story-title" className="input" value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
      </div>
      <div className="row wrap mb-2" style={{ gap: '0.3rem' }} role="radiogroup" aria-label="Story format">
        {(['star', 'concise'] as const).map((format) => (
          <button key={format} role="radio" aria-checked={draft.format === format} className={`chip ${draft.format === format ? 'chip--active' : ''}`} onClick={() => patch({ format })}>
            {format === 'star' ? 'STAR' : 'Concise story'}
          </button>
        ))}
      </div>
      {draft.format === 'star' && (
        <>
          {field('situation', 'Situation', 'Context: the synthetic lab or scenario.')}
          {field('task', 'Task', 'What you were responsible for.')}
          {field('action', 'Action', 'What you did: analysis, evidence, decisions.')}
          {field('result', 'Result', 'Outcome: finding, fix, what you learned.')}
        </>
      )}
      <div className="field">
        <label className="label" htmlFor="story-memo">English answer memo (1-2 minutes)</label>
        <textarea id="story-memo" className="textarea" style={{ minHeight: 90 }} value={draft.memo} placeholder="The short spoken answer you would give in an interview." onChange={(e) => patch({ memo: e.target.value })} />
        <p className={`term t-xs mt-1 ${memoStatus === 'good' ? 'neon-green' : 'neon-amber'}`} style={{ marginBottom: 0 }}>
          ≈ {seconds}s spoken · {memoStatus === 'good' ? 'good length' : memoStatus === 'short' ? 'aim for 45-150 seconds' : 'trim to under 2.5 minutes'}
        </p>
      </div>
      {draft.evidence.length > 0 && <p className="term t-xs dim">Evidence: {draft.evidence.join('; ')}</p>}
      <div className="row wrap" style={{ gap: '0.4rem' }}>
        <button className="btn btn--primary btn--sm" onClick={() => { upsertStory(draft); setSaved(true) }}>{saved ? '✓ Saved' : 'Save story'}</button>
        <button className="btn btn--ghost btn--sm" onClick={onClose}>Close</button>
        <button className="btn btn--danger btn--sm" onClick={() => { deleteStory(draft.id); onClose() }}>Delete</button>
      </div>
    </Panel>
  )
}

export function InterviewTracker() {
  const domains = useDomainStats()
  const modules = useModuleStats()
  const questions = useActiveQuestions()
  const attempts = useStore((s) => s.attempts)
  const flagAttempts = useStore((s) => s.flagAttempts)
  const reports = useStore((s) => s.reports)
  const trackSubmissions = useStore((s) => s.trackSubmissions)
  const stories = useStore((s) => s.interviewStories)
  const [editing, setEditing] = useState<InterviewStory | null>(null)

  const trackAccuracy = useMemo(() => {
    const trackOf = new Map(questions.filter((q) => q.module === 0 && q.track).map((q) => [q.id, q.track as TrackKey]))
    const last = new Map<string, boolean>()
    for (const attempt of attempts) if (trackOf.has(attempt.questionId)) last.set(attempt.questionId, attempt.correct)
    const totals = new Map<TrackKey, { attempts: number; correct: number }>()
    for (const [questionId, correct] of last) {
      const track = trackOf.get(questionId)!
      const row = totals.get(track) ?? { attempts: 0, correct: 0 }
      row.attempts++
      if (correct) row.correct++
      totals.set(track, row)
    }
    const out: Partial<Record<TrackKey, { attempts: number; accuracyPct: number }>> = {}
    for (const [track, row] of totals) out[track] = { attempts: row.attempts, accuracyPct: Math.round((row.correct / row.attempts) * 100) }
    return out
  }, [attempts, questions])

  const skills = useMemo(
    () => skillEvidence({ domains, modules, labs: LABS, flagAttempts, reports, trackChallenges: TRACK_CHALLENGES, trackSubmissions, trackAccuracy }),
    [domains, modules, flagAttempts, reports, trackSubmissions, trackAccuracy],
  )
  const counts = { strong: skills.filter((skill) => skill.status === 'strong').length, gap: skills.filter((skill) => skill.status === 'gap').length }

  const startStory = (skill: SkillEvidence) => setEditing(blankStory(skill))

  return (
    <div className="page">
      <PageHeader
        eyebrow="CEH+ // Interview Readiness"
        title="Interview Tracker"
        sub="Map what you studied and practised to stories you can tell: evidence per skill, STAR stories, honest gaps with a plan, and short English answer memos."
        actions={<Link className="btn btn--ghost btn--sm" to="/portfolio">Portfolio →</Link>}
      />
      <Panel className="mb-3" brackets>
        <div className="row wrap" style={{ gap: '1.4rem' }}>
          <div className="stat"><div className="stat__value">{counts.strong}</div><div className="stat__label">Strong skills</div></div>
          <div className="stat"><div className="stat__value">{counts.gap}</div><div className="stat__label">Honest gaps</div></div>
          <div className="stat"><div className="stat__value">{stories.length}</div><div className="stat__label">Saved stories</div></div>
          <div className="stat"><div className="stat__value">{stories.filter(storyComplete).length}</div><div className="stat__label">Complete</div></div>
        </div>
        <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>
          Stories flow into the Portfolio exporter (public-safe by default). Describe synthetic labs only — never real employers, clients, or targets.
        </p>
      </Panel>

      {editing && <div className="mb-3"><StoryEditor key={editing.id} story={editing} onClose={() => setEditing(null)} /></div>}

      {stories.length > 0 && (
        <Panel title="Saved stories" className="mb-3">
          <div className="stack stack--sm">
            {stories.map((story) => (
              <button key={story.id} className="neon-card" onClick={() => setEditing(story)}>
                <div className="row row--between wrap" style={{ gap: '0.4rem' }}>
                  <span className="t-sm" style={{ color: 'var(--text-main)' }}>{story.title}</span>
                  <span className="row" style={{ gap: '0.3rem' }}>
                    <span className={`badge ${story.kind === 'gap' ? 'badge--amber' : 'badge--cyan'}`}>{story.kind}</span>
                    <span className="badge">{story.format}</span>
                    <span className="badge">≈ {speakingSeconds(story.memo)}s</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid-cards">
        {skills.map((skill) => (
          <Panel key={skill.id} title={skill.name} right={<span className={`badge ${STATUS_CLASS[skill.status]}`}>{skill.status}</span>}>
            <ul className="term t-xs muted" style={{ paddingLeft: '1.1rem', margin: 0 }}>
              <li>Concepts: {skill.conceptAccuracyPct === null ? 'not practised yet' : `${skill.conceptAccuracyPct}% over ${skill.conceptAttempts} attempts`}</li>
              <li>Labs solved: {skill.labs.length > 0 ? skill.labs.join('; ') : 'none yet'}</li>
              <li>Reports: {skill.reports.length > 0 ? skill.reports.join('; ') : 'none yet'}</li>
              {skill.challengesTotal > 0 && <li>Track challenges: {skill.challengesSolved}/{skill.challengesTotal}</li>}
              {skill.weakModules.length > 0 && <li>Weak modules: {skill.weakModules.map((module) => `M${module.module} (${module.masteryPct}%)`).join(', ')}</li>}
            </ul>
            {skill.status === 'gap' && (
              <p className="term t-xs neon-amber mt-2" style={{ marginBottom: 0 }}>{honestGapStatement(skill)}</p>
            )}
            {skill.status !== 'gap' && skill.nextPlan.length > 0 && (
              <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>Next: {skill.nextPlan[0]}</p>
            )}
            <button className="btn btn--ghost btn--sm mt-2" onClick={() => startStory(skill)}>
              {skill.status === 'gap' ? '＋ Gap + plan story' : '＋ STAR story'}
            </button>
          </Panel>
        ))}
      </div>
    </div>
  )
}
