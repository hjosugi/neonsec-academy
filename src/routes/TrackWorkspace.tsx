import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { TrackKey, TrackTimelineEvent } from '../types'
import { TRACK_CHALLENGES, trackChallengeById } from '../data/tracks'
import { TRACKS } from '../data/taxonomy'
import { moduleMeta } from '../data/taxonomy'
import { useStore } from '../store/useStore'
import {
  TRACK_KIND_LABELS,
  WRITEUP_MIN_LENGTH,
  gradeTrackDraft,
  latestSubmissions,
  timelineFromLines,
  trackStats,
} from '../lib/trackChallenges'
import { formatLineRange, normalizeLineSelection } from '../lib/labReport'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'
import { EmptyState } from '../components/ui/EmptyState'

const CHALLENGE_TRACKS: TrackKey[] = ['appsec', 'cloud', 'soc']

function isChallengeTrack(value: string): value is TrackKey {
  return CHALLENGE_TRACKS.includes(value as TrackKey)
}

function StatTable({ title, rows }: { title: string; rows: ReturnType<typeof trackStats>['byCategory'] }) {
  return (
    <Panel title={title}>
      <div className="scroll-x">
        <table className="table">
          <thead><tr><th>Area</th><th>Attempted</th><th>Solved</th><th>Accuracy</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <td>{row.key}</td>
                <td className="tabnum">{row.attempted}/{row.total}</td>
                <td className="tabnum">{row.solved}</td>
                <td>
                  {row.attempted === 0
                    ? <span className="badge">—</span>
                    : <span className={`badge ${row.accuracyPct >= 70 ? 'badge--green' : 'badge--amber'}`}>{row.accuracyPct}%</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function TrackChallengeList() {
  const { track = '' } = useParams()
  const submissions = useStore((s) => s.trackSubmissions)
  if (!isChallengeTrack(track)) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Panel><EmptyState glyph="⌀" title="Track not found"><Link className="btn btn--primary" to="/beyond">← CEH+ Tracks</Link></EmptyState></Panel>
      </div>
    )
  }
  const challenges = TRACK_CHALLENGES.filter((challenge) => challenge.track === track)
  const stats = trackStats(TRACK_CHALLENGES, submissions, track)
  const latest = latestSubmissions(submissions)
  const meta = TRACKS[track]

  return (
    <div className="page">
      <PageHeader
        eyebrow={`CEH+ // ${meta.name}`}
        title={`${meta.short} Challenges`}
        sub={`${meta.blurb} Every artifact is synthetic: select the lines that matter, classify the issue, and write the deliverables.`}
        actions={<Link className="btn btn--ghost btn--sm" to="/beyond">← CEH+ Tracks</Link>}
      />
      <Panel className="mb-3" brackets>
        <div className="row wrap" style={{ gap: '1.4rem' }}>
          <div className="stat"><div className="stat__value">{stats.solved}/{stats.total}</div><div className="stat__label">Solved</div></div>
          <div className="stat"><div className="stat__value">{stats.attempted}</div><div className="stat__label">Attempted</div></div>
          <div className="stat"><div className="stat__value">{stats.averageScorePct}%</div><div className="stat__label">Average score</div></div>
        </div>
        {stats.weakest.length > 0 && (
          <p className="term t-xs neon-amber mt-2" style={{ marginBottom: 0 }}>
            Weakest: {stats.weakest.map((row) => `${row.key} ${row.accuracyPct}%`).join(' · ')} — missed challenges are queued in Review.
          </p>
        )}
      </Panel>

      <div className="grid-cards mb-3">
        {challenges.map((challenge) => {
          const submission = latest.get(challenge.id)
          return (
            <Link key={challenge.id} to={`/tracks/${track}/${challenge.id}`} className="neon-card">
              <div className="row row--between">
                <span className="badge badge--cyan">{challenge.id}</span>
                <span className={`diff diff--${challenge.difficulty}`}>◆ {challenge.difficulty}</span>
              </div>
              <h3 className="display mt-1" style={{ fontSize: '0.95rem' }}>{challenge.title}</h3>
              <div className="row wrap mt-1" style={{ gap: '0.3rem' }}>
                <span className="badge">{challenge.category}</span>
                <span className={`badge ${submission?.correct ? 'badge--green' : submission ? 'badge--amber' : ''}`}>
                  {submission?.correct ? `solved · ${submission.scorePct}%` : submission ? `retry · ${submission.scorePct}%` : 'new'}
                </span>
              </div>
              <p className="term t-xs dim mt-2" style={{ lineHeight: 1.5 }}>
                {challenge.scenario.length > 120 ? `${challenge.scenario.slice(0, 118)}…` : challenge.scenario}
              </p>
            </Link>
          )
        })}
      </div>

      <div className="grid-2">
        <StatTable title="Weakness by category" rows={stats.byCategory} />
        <StatTable title="Weakness by skill" rows={stats.bySkill} />
      </div>
    </div>
  )
}

export function TrackChallengeDetail() {
  const { track = '', id = '' } = useParams()
  const navigate = useNavigate()
  const challenge = trackChallengeById(id)
  const submissions = useStore((s) => s.trackSubmissions)
  const submitTrackChallenge = useStore((s) => s.submitTrackChallenge)
  const sendTrackChallengeToTriage = useStore((s) => s.sendTrackChallengeToTriage)
  const addTrackChallengeToReport = useStore((s) => s.addTrackChallengeToReport)
  const last = useMemo(() => [...submissions].reverse().find((item) => item.challengeId === id), [submissions, id])
  const [selected, setSelected] = useState<number[]>(() => last?.selectedLines ?? [])
  const [classification, setClassification] = useState(() => last?.classification ?? '')
  const [writeups, setWriteups] = useState<Record<string, string>>(() => last?.writeups ?? {})
  const [timeline, setTimeline] = useState<TrackTimelineEvent[]>(() => last?.timeline ?? [])
  const [showResult, setShowResult] = useState(Boolean(last))
  const [message, setMessage] = useState<{ text: string; to?: string } | null>(null)

  if (!challenge || challenge.track !== track) {
    return (
      <div className="page" style={{ maxWidth: 640 }}>
        <Panel><EmptyState glyph="⌀" title="Challenge not found"><Link className="btn btn--primary" to="/beyond">← CEH+ Tracks</Link></EmptyState></Panel>
      </div>
    )
  }

  const draft = { selectedLines: selected, classification, writeups, timeline: challenge.track === 'soc' ? timeline : undefined }
  const grade = gradeTrackDraft(challenge, draft)
  const selection = normalizeLineSelection(selected, challenge.artifact.lines.length)
  const isSoc = challenge.track === 'soc'

  const toggle = (line: number) => {
    const next = selection.includes(line) ? selection.filter((value) => value !== line) : [...selection, line]
    setSelected(next)
    setShowResult(false)
    if (isSoc) {
      const rebuilt = timelineFromLines(challenge, next).map((event) => timeline.find((item) => item.line === event.line) ?? event)
      setTimeline(rebuilt)
    }
  }

  const submit = () => {
    const result = submitTrackChallenge(challenge.id, draft)
    if (result) {
      setShowResult(true)
      setMessage({ text: result.correct ? 'Correct lines and classification recorded.' : 'Recorded. The challenge is queued in Review so you can retry it.' })
    }
  }

  const lineClass = (line: number) => {
    const picked = selection.includes(line)
    if (!showResult) return picked ? 'is-selected' : ''
    if (challenge.answerLines.includes(line)) return picked ? 'is-correct' : 'is-missed'
    return picked ? 'is-wrong' : ''
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow={<>CEH+ // {TRACKS[challenge.track].short} // {TRACK_KIND_LABELS[challenge.kind]}</>}
        title={challenge.title}
        actions={<Link className="btn btn--ghost btn--sm" to={`/tracks/${challenge.track}`}>← {TRACKS[challenge.track].short} challenges</Link>}
      />
      <Panel className="mb-3" style={{ borderColor: 'rgba(255,204,0,0.4)' }}>
        <p className="t-sm muted" style={{ marginTop: 0 }}>{challenge.scenario}</p>
        <div className="row wrap" style={{ gap: '0.3rem' }}>
          <span className="badge">{challenge.category}</span>
          {challenge.cehModules.map((module) => <span key={module} className="badge badge--cyan">M{module} {moduleMeta(module)?.short}</span>)}
          {challenge.skills.map((skill) => <span key={skill} className="badge badge--purple">{skill}</span>)}
        </div>
        <p className="term t-xs mt-2" style={{ color: 'var(--warning-amber)', marginBottom: 0 }}>
          Scope: this synthetic artifact only. Static review — do not run the code, contact any host, or reuse any value.
        </p>
      </Panel>

      <div className="grid-dash">
        <div className="stack">
          <Panel title={challenge.artifact.label} right={<span className="term t-xs dim">{challenge.artifact.language}</span>}>
            <p className="term t-xs dim">{challenge.linePrompt}</p>
            <div className="dataset-view" role="group" aria-label={`${challenge.artifact.label} lines`}>
              {challenge.artifact.lines.map((text, index) => {
                const line = index + 1
                return (
                  <button
                    key={line}
                    type="button"
                    className={`dataset-view__line ${lineClass(line)}`}
                    aria-pressed={selection.includes(line)}
                    onClick={() => toggle(line)}
                  >
                    <span className="dataset-view__no">{line}</span>
                    <code className="dataset-view__text">{text || ' '}</code>
                  </button>
                )
              })}
            </div>
            <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>
              {selection.length > 0 ? `Selected ${formatLineRange(selection)}` : 'No lines selected yet.'}
              {showResult && ` · expected ${formatLineRange(challenge.answerLines)}`}
            </p>
          </Panel>

          {isSoc && (
            <Panel title="Timeline builder" right={<span className="term t-xs dim">{timeline.length} events</span>}>
              {timeline.length === 0 ? (
                <p className="term t-xs dim" style={{ marginBottom: 0 }}>Select timestamped log lines to add them to the timeline.</p>
              ) : (
                <div className="stack stack--sm">
                  {timeline.map((event) => (
                    <div key={event.line} className="row wrap" style={{ gap: '0.5rem', alignItems: 'center' }}>
                      <code className="t-xs">{event.time}</code>
                      <span className="badge">L{event.line}</span>
                      <input
                        className="input grow"
                        style={{ minWidth: 200 }}
                        aria-label={`Observation for line ${event.line}`}
                        value={event.observation}
                        placeholder="What happened at this moment?"
                        onChange={(e) => setTimeline((current) => current.map((item) => item.line === event.line ? { ...item, observation: e.target.value } : item))}
                      />
                    </div>
                  ))}
                </div>
              )}
              {showResult && challenge.timeline && (
                <div className="mt-3">
                  <div className="term t-xs dim mb-1">Model timeline</div>
                  {challenge.timeline.map((entry) => (
                    <p key={`${entry.time}-${entry.line}`} className="term t-xs muted" style={{ margin: '0 0 0.25rem' }}>
                      {entry.time} · L{entry.line} — {entry.observation}
                    </p>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>

        <div className="stack">
          <Panel title="Classify">
            <p className="t-sm" style={{ color: 'var(--text-main)' }}>{challenge.classification.prompt}</p>
            <div className="stack stack--sm" role="radiogroup" aria-label={challenge.classification.prompt}>
              {challenge.classification.options.map((option) => {
                const state = showResult && option === challenge.classification.answer ? 'is-correct' : showResult && option === classification ? 'is-wrong' : classification === option ? 'is-selected' : ''
                return (
                  <button key={option} role="radio" aria-checked={classification === option} className={`choice ${state}`} onClick={() => { setClassification(option); setShowResult(false) }}>
                    {option}
                  </button>
                )
              })}
            </div>
          </Panel>

          <Panel title="Deliverables">
            {challenge.writeups.map((field) => (
              <div className="field" key={field.key}>
                <label className="label" htmlFor={`writeup-${field.key}`}>{field.label}</label>
                <textarea
                  id={`writeup-${field.key}`}
                  className="textarea"
                  style={{ minHeight: 56 }}
                  value={writeups[field.key] ?? ''}
                  placeholder={field.prompt}
                  onChange={(e) => { setWriteups((current) => ({ ...current, [field.key]: e.target.value })); setShowResult(false) }}
                />
                {showResult && <p className="term t-xs neon-green mt-1" style={{ marginBottom: 0 }}>Model: {field.model}</p>}
              </div>
            ))}
            <button className="btn btn--primary btn--block" onClick={submit} disabled={selection.length === 0 || !classification}>
              Submit review
            </button>
            {!grade.writeupsComplete && (
              <p className="term t-xs dim mt-1" style={{ marginBottom: 0 }}>Write at least {WRITEUP_MIN_LENGTH} characters in each deliverable for full credit.</p>
            )}
          </Panel>

          {showResult && last && (
            <Panel title="Result" right={<span className={`badge ${last.correct ? 'badge--green' : 'badge--amber'}`}>{last.correct ? 'correct' : 'retry'} · {last.scorePct}%</span>}>
              <p className="term t-xs">
                Lines {grade.linesCorrect ? '✓' : `✕ (missed ${grade.missedLines.length ? formatLineRange(grade.missedLines) : 'none'}, extra ${grade.extraLines.length ? formatLineRange(grade.extraLines) : 'none'})`} ·
                classification {grade.classificationCorrect ? '✓' : '✕'} · writeups {grade.writeupsComplete ? '✓' : `missing ${grade.missingWriteups.join(', ')}`}
              </p>
              <div className="term t-xs dim">Why</div>
              <p className="t-sm muted mt-1">{challenge.explanation}</p>
              <div className="term t-xs dim">Remediation</div>
              <p className="t-sm muted mt-1">{challenge.remediation}</p>
              {challenge.leastPrivilege && (<><div className="term t-xs dim">Least privilege</div><p className="t-sm muted mt-1">{challenge.leastPrivilege}</p></>)}
              {challenge.detection && (<><div className="term t-xs dim">Detection logic</div><p className="t-sm muted mt-1">{challenge.detection}</p></>)}
              {challenge.containment && (<><div className="term t-xs dim">Containment</div><p className="t-sm muted mt-1">{challenge.containment}</p></>)}
              {challenge.safeFix && (
                <>
                  <div className="term t-xs dim">Safe fix</div>
                  <pre className="mt-1" style={{ background: 'var(--bg-abyss)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-md)', padding: '0.7rem', fontSize: '0.78rem', overflowX: 'auto' }}>
                    <code>{challenge.safeFix.join('\n')}</code>
                  </pre>
                </>
              )}
              {challenge.testIdea && (<><div className="term t-xs dim">Unit-test idea</div><p className="t-sm muted mt-1">{challenge.testIdea}</p></>)}
              <div className="row wrap mt-2" style={{ gap: '0.4rem' }}>
                <button className="btn btn--ghost btn--sm" onClick={() => { if (sendTrackChallengeToTriage(challenge.id)) setMessage({ text: 'Finding created on the Triage board.', to: '/triage' }) }}>
                  ⚖ Create finding
                </button>
                <button className="btn btn--ghost btn--sm" onClick={() => {
                  const reportId = addTrackChallengeToReport(challenge.id)
                  if (reportId) setMessage({ text: 'Added to the track review report.', to: reportId })
                }}>
                  ⎙ Add to report
                </button>
              </div>
            </Panel>
          )}
          {message && (
            <div className="row wrap" style={{ gap: '0.5rem' }} role="status">
              <span className="term t-xs neon-green">{message.text}</span>
              {message.to === '/triage' && <Link className="btn btn--ghost btn--sm" to="/triage">Open triage →</Link>}
              {message.to && message.to !== '/triage' && (
                <button className="btn btn--ghost btn--sm" onClick={() => navigate('/reports', { state: { openReportId: message.to } })}>Open report →</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
