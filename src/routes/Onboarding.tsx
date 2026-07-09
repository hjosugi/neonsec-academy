import { useState } from 'react'
import type { StudyGoal } from '../types'
import { useStore } from '../store/useStore'
import { SEED_QUESTIONS } from '../data/questions'

const GOALS: Array<{ id: StudyGoal; label: string; hint: string }> = [
  { id: 'ceh-exam', label: 'CEH Exam', hint: 'Knowledge bank, review queue, mock scores' },
  { id: 'ceh-practical', label: 'CEH Practical', hint: 'Safe labs, evidence, reports' },
  { id: 'ceh-plus', label: 'CEH+', hint: 'Beyond tracks and portfolio practice' },
  { id: 'all', label: 'All Paths', hint: 'Full trainer with every route enabled' },
]

export function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding)
  const updateProfile = useStore((s) => s.updateProfile)
  const updateSettings = useStore((s) => s.updateSettings)
  const archiveQuestion = useStore((s) => s.archiveQuestion)
  const settings = useStore((s) => s.settings)
  const [target, setTarget] = useState(85)
  const [goal, setGoal] = useState<StudyGoal>('all')
  const [dailyGoal, setDailyGoal] = useState(settings.dailyGoal)
  const [targetDate, setTargetDate] = useState('')
  const [useSeedBank, setUseSeedBank] = useState(true)
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false)

  const enter = () => {
    updateProfile({
      examTargetPct: target,
      studyGoal: goal,
      targetDate: targetDate || null,
      safetyAcknowledged,
      useSeedBank,
    })
    updateSettings({ dailyGoal })
    if (!useSeedBank) {
      for (const question of SEED_QUESTIONS) archiveQuestion(question.id)
    }
    complete()
  }

  return (
    <div className="overlay" style={{ zIndex: 200 }}>
      <div className="modal" style={{ width: 'min(560px, 100%)' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__body">
          <div className="center mb-3">
            <div className="brand__mark" style={{ fontSize: '2.6rem' }}>
              ◉
            </div>
            <h1 className="glitch" data-text="NEONSEC ACADEMY" style={{ letterSpacing: '0.14em' }}>
              NEONSEC ACADEMY
            </h1>
            <div className="term dim upper" style={{ letterSpacing: '0.3em', fontSize: '0.72rem' }}>
              CEH Trainer · Induction
            </div>
          </div>

          <p className="muted mb-2">
            A cyberpunk trainer for the Certified Ethical Hacker exam. Drill a{' '}
            <span className="neon-cyan">{SEED_QUESTIONS.length}-question</span> bank, let spaced repetition schedule your
            reviews, and sit domain-weighted mock exams until you are ready.
          </p>

          <div className="grid-3 mb-3" style={{ gap: '0.6rem' }}>
            {[
              { g: '▤', t: 'Question Bank', d: '20 CEH modules' },
              { g: '↻', t: 'Smart Review', d: 'SM-2 scheduling' },
              { g: '⏱', t: 'Mock Exams', d: '125Q · 4h format' },
            ].map((x) => (
              <div key={x.t} className="panel" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem' }} className="neon-cyan">
                  {x.g}
                </div>
                <div className="display t-sm">{x.t}</div>
                <div className="term t-xs dim">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="panel mb-3" style={{ borderColor: 'rgba(255,51,102,0.4)' }}>
            <div className="panel__title" style={{ color: 'var(--danger-red)' }}>
              <span style={{ background: 'var(--danger-red)', boxShadow: 'var(--glow-red)' }} /> Safety pledge
            </div>
            <p className="t-sm muted mt-1">
              This is authorized, <strong>defensive</strong> learning. Every lab uses{' '}
              <strong>synthetic data only</strong>. No scanning real targets, no real credentials, no
              live malware — knowledge and judgment, not operational attacks.
            </p>
          </div>

          <div className="field">
            <label className="label">Primary goal</label>
            <div className="grid-2" style={{ gap: '0.55rem' }}>
              {GOALS.map((item) => (
                <button
                  key={item.id}
                  className={`choice ${goal === item.id ? 'is-selected' : ''}`}
                  onClick={() => setGoal(item.id)}
                  type="button"
                >
                  <span className="choice__key">{goal === item.id ? '✓' : '○'}</span>
                  <span>
                    <span className="display t-sm">{item.label}</span>
                    <span className="term t-xs dim" style={{ display: 'block' }}>{item.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">Target mock score · {target}%</label>
            <input
              type="range"
              min={65}
              max={95}
              step={5}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div className="term t-xs dim">CEH cut scores vary 65–85% by exam form — aim higher in practice.</div>
          </div>

          <div className="grid-2" style={{ gap: '0.8rem' }}>
            <div className="field">
              <label className="label">Daily review size · {dailyGoal}</label>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div className="field">
              <label className="label">Target date</label>
              <input className="input" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
          </div>

          <label className="row mb-2" style={{ gap: '0.6rem', alignItems: 'flex-start' }}>
            <input type="checkbox" checked={useSeedBank} onChange={(e) => setUseSeedBank(e.target.checked)} />
            <span className="term t-xs muted">
              Start with the built-in {SEED_QUESTIONS.length}-question synthetic seed bank.
            </span>
          </label>

          <label className="row mb-2" style={{ gap: '0.6rem', alignItems: 'flex-start' }}>
            <input type="checkbox" checked={safetyAcknowledged} onChange={(e) => setSafetyAcknowledged(e.target.checked)} />
            <span className="term t-xs muted">
              I will use NeonSec only for authorized defensive learning with local or synthetic material.
            </span>
          </label>

          <button className="btn btn--primary btn--lg btn--block mt-2" onClick={enter} disabled={!safetyAcknowledged}>
            Enter the Academy →
          </button>
        </div>
      </div>
    </div>
  )
}
