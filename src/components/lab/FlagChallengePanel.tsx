import { useMemo, useState, type FormEvent } from 'react'
import type { Lab } from '../../data/labs'
import { useStore } from '../../store/useStore'
import {
  flagAttemptsForChallenge,
  flagHintUsesForChallenge,
  sanitizeFlagSubmission,
} from '../../lib/flagChallenge'
import { formatDateTime } from '../../lib/format'
import { Panel } from '../ui/Panel'

interface FlagChallengePanelProps {
  lab: Lab
  onSolved: () => void
  onOpenReport: () => void
}

export function FlagChallengePanel({ lab, onSolved, onOpenReport }: FlagChallengePanelProps) {
  const allAttempts = useStore((state) => state.flagAttempts)
  const allHintUses = useStore((state) => state.flagHintUses)
  const submitLabFlag = useStore((state) => state.submitLabFlag)
  const revealLabFlagHint = useStore((state) => state.revealLabFlagHint)
  const attempts = useMemo(
    () => flagAttemptsForChallenge(allAttempts, lab.id),
    [allAttempts, lab.id],
  )
  const hintUses = useMemo(
    () => flagHintUsesForChallenge(allHintUses, lab.id),
    [allHintUses, lab.id],
  )
  const usedHintIndexes = useMemo(
    () => new Set(hintUses.map((use) => use.hintIndex)),
    [hintUses],
  )
  const solved = attempts.some((attempt) => attempt.correct)
  const challenge = lab.flagChallenge
  const [submission, setSubmission] = useState('')
  const [feedback, setFeedback] = useState('')
  const [feedbackKind, setFeedbackKind] = useState<'error' | 'success' | 'info'>('info')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (solved) return
    if (!sanitizeFlagSubmission(submission)) {
      setFeedback('Enter one non-empty training flag. Control characters and values over 160 characters are rejected.')
      setFeedbackKind('error')
      return
    }

    const attempt = submitLabFlag(lab.id, submission)
    if (!attempt) {
      setFeedback('The flag could not be recorded. Reload the challenge and try again.')
      setFeedbackKind('error')
      return
    }
    if (attempt.correct) {
      setFeedback('Flag accepted. Explanation, remediation, and report prompt are now unlocked.')
      setFeedbackKind('success')
      setSubmission('')
      onSolved()
    } else {
      setFeedback('Flag not accepted. Re-check the supplied assets or reveal a scoped hint.')
      setFeedbackKind('info')
    }
  }

  const revealHint = (hintIndex: number) => {
    revealLabFlagHint(lab.id, hintIndex)
    setFeedback(`Hint ${hintIndex + 1} recorded. Hint use contributes to the configured lab penalty.`)
    setFeedbackKind('info')
  }

  const feedbackClass = feedbackKind === 'success'
    ? 'neon-green'
    : feedbackKind === 'error'
      ? 'neon-red'
      : 'neon-amber'

  return (
    <Panel
      title="Flag Challenge"
      right={
        <div className="row wrap" style={{ gap: '0.35rem' }}>
          <span className={`badge ${solved ? 'badge--green' : attempts.length > 0 ? 'badge--amber' : 'badge--cyan'}`}>
            {solved ? 'solved' : attempts.length > 0 ? 'in progress' : 'ready'}
          </span>
          <span className="term t-xs dim">{attempts.length} attempts · {hintUses.length} hints</span>
        </div>
      }
    >
      <p className="t-sm" style={{ color: 'var(--text-main)' }}>{challenge.prompt}</p>

      <div className="panel mb-3" style={{ background: 'var(--panel-inset)', padding: '0.75rem 0.85rem' }}>
        <div className="term t-xs dim mb-1">Provided local assets</div>
        <div className="stack stack--sm">
          {challenge.assets.map((asset) => (
            <div key={asset.id} className="row wrap" style={{ gap: '0.4rem', alignItems: 'baseline' }}>
              <span className="badge badge--purple">{asset.kind}</span>
              <strong className="t-sm">{asset.label}</strong>
              <span className="term t-xs muted">{asset.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="term t-xs mb-3"
        role="note"
        style={{
          color: 'var(--warning-amber)',
          borderLeft: '2px solid var(--warning-amber)',
          paddingLeft: '0.7rem',
        }}
      >
        Use only the supplied synthetic assets. Submit a value in <code>FLAG{'{UPPER_SNAKE_CASE}'}</code> format.
        Never paste a real credential, token, customer value, or production secret.
      </div>

      {!solved && (
        <form onSubmit={submit} className="mb-3">
          <div className="field">
            <label className="label" htmlFor={`flag-submission-${lab.id}`}>Flag submission</label>
            <div className="row wrap" style={{ gap: '0.5rem' }}>
              <input
                id={`flag-submission-${lab.id}`}
                className="input grow"
                style={{ minWidth: 220 }}
                value={submission}
                onChange={(event) => setSubmission(event.target.value)}
                placeholder="FLAG{...}"
                autoComplete="off"
                spellCheck={false}
                maxLength={160}
              />
              <button className="btn btn--primary" type="submit">Submit flag</button>
            </div>
          </div>
        </form>
      )}

      {feedback && (
        <p className={`term t-xs ${feedbackClass} mb-3`} role={feedbackKind === 'error' ? 'alert' : 'status'}>
          {feedback}
        </p>
      )}

      <div className="mb-3">
        <div className="term t-xs dim mb-1">Scoped hints</div>
        <div className="stack stack--sm">
          {challenge.hints.map((hint, index) => {
            const used = usedHintIndexes.has(index)
            return (
              <div key={hint} className="panel" style={{ background: 'var(--panel-inset)', padding: '0.65rem 0.75rem' }}>
                <div className="row row--between wrap" style={{ gap: '0.5rem' }}>
                  <span className="term t-xs">Hint {index + 1}</span>
                  {used ? (
                    <span className="badge badge--amber">used</span>
                  ) : solved ? (
                    <span className="badge">not used</span>
                  ) : (
                    <button className="btn btn--ghost btn--sm" type="button" onClick={() => revealHint(index)}>
                      Reveal + record
                    </button>
                  )}
                </div>
                {used && <p className="t-sm muted mt-1" style={{ marginBottom: 0 }}>{hint}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {attempts.length > 0 && (
        <div className="mb-3">
          <div className="term t-xs dim mb-1">Attempt history</div>
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Submission</th>
                  <th>Result</th>
                  <th>Hints</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 8).map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="term t-xs dim">{formatDateTime(attempt.at)}</td>
                    <td><code>{attempt.submitted}</code></td>
                    <td>
                      <span className={`badge ${attempt.correct ? 'badge--green' : 'badge--red'}`}>
                        {attempt.correct ? 'accepted' : 'incorrect'}
                      </span>
                    </td>
                    <td className="term t-xs dim">{attempt.hintCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {solved && (
        <div
          className="panel"
          style={{ background: 'rgba(57,255,20,0.04)', borderColor: 'rgba(57,255,20,0.35)' }}
        >
          <div className="panel__title" style={{ color: 'var(--acid-green)' }}>✓ Challenge resolved</div>
          <div className="stack stack--sm mt-2">
            <div>
              <div className="term t-xs dim">Explanation</div>
              <p className="t-sm muted mt-1">{challenge.explanation}</p>
            </div>
            <div>
              <div className="term t-xs dim">Remediation</div>
              <p className="t-sm muted mt-1">{challenge.remediation}</p>
            </div>
            <div>
              <div className="term t-xs dim">Report prompt</div>
              <p className="t-sm muted mt-1">{challenge.reportPrompt}</p>
            </div>
          </div>
          <button className="btn btn--green btn--sm" type="button" onClick={onOpenReport}>
            Continue to report →
          </button>
        </div>
      )}
    </Panel>
  )
}
