import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LANDING_COPY, LANDING_SCREENS, LANDING_VALUES, type LandingScreen } from '../data/landing'
import { useStore } from '../store/useStore'
import { DEMO_EXAM_SESSION_ID, DEMO_REPORT_ID } from '../lib/demoData'
import { Panel } from '../components/ui/Panel'

function screenTarget(screen: LandingScreen['id']): { to: string; state?: unknown } {
  switch (screen) {
    case 'dashboard':
      return { to: '/' }
    case 'review':
      return { to: '/review' }
    case 'exam-report':
      return { to: `/exam/result/${DEMO_EXAM_SESSION_ID}` }
    case 'lab-report':
      return { to: '/reports', state: { openReportId: DEMO_REPORT_ID } }
    case 'city-map':
      return { to: '/map' }
  }
}

export function Landing() {
  const navigate = useNavigate()
  const demo = useStore((s) => s.demo)
  const startDemo = useStore((s) => s.startDemo)
  const exitDemo = useStore((s) => s.exitDemo)
  const completeOnboarding = useStore((s) => s.completeOnboarding)
  const [error, setError] = useState('')

  const launchDemo = (target?: LandingScreen['id']) => {
    if (!demo.active && !startDemo()) {
      setError('Demo mode needs browser storage to park your progress safely. Nothing was changed.')
      return
    }
    const dest = screenTarget(target ?? 'dashboard')
    navigate(dest.to, dest.state ? { state: dest.state } : undefined)
  }

  return (
    <div className="page" style={{ maxWidth: 1080 }}>
      <Panel className="mb-3" brackets>
        <div className="page__eyebrow" style={{ margin: 0 }}>{LANDING_COPY.eyebrow}</div>
        <h1 className="display mt-1" style={{ fontSize: 'clamp(1.5rem, 3.4vw, 2.3rem)', lineHeight: 1.2 }}>{LANDING_COPY.headline}</h1>
        <p className="muted mt-2" style={{ maxWidth: '70ch' }}>{LANDING_COPY.subhead}</p>
        <div className="row wrap mt-3" style={{ gap: '0.5rem' }}>
          <button className="btn btn--primary" onClick={() => launchDemo()}>{demo.active ? 'Continue the demo' : LANDING_COPY.demoCta} →</button>
          {demo.active ? (
            <button className="btn btn--ghost" onClick={() => { exitDemo(); navigate('/') }}>Exit demo and restore my progress</button>
          ) : (
            <button className="btn btn--ghost" onClick={() => { completeOnboarding(); navigate('/') }}>{LANDING_COPY.startCta}</button>
          )}
        </div>
        <p className="term t-xs dim mt-2" style={{ marginBottom: 0 }}>{LANDING_COPY.demoNote}</p>
        {error && <p className="term t-xs neon-red mt-2" role="alert">{error}</p>}
      </Panel>

      <div className="grid-3 mb-3">
        {LANDING_VALUES.map((value) => (
          <Panel key={value.id} title={value.title}>
            <p className="t-sm muted">{value.body}</p>
            <p className="term t-xs neon-green" style={{ marginBottom: 0 }}>{value.proof}</p>
          </Panel>
        ))}
      </div>

      <Panel title="See it with demo data" className="mb-3">
        <div className="grid-cards">
          {LANDING_SCREENS.map((screen) => (
            <button key={screen.id} className="neon-card" onClick={() => launchDemo(screen.id)}>
              <span className="display t-sm" style={{ color: 'var(--text-main)' }}>{screen.title}</span>
              <span className="term t-xs dim mt-1" style={{ display: 'block' }}>{screen.body}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="panel__title" style={{ color: 'var(--acid-green)' }}>Safe by design</div>
        <p className="t-sm muted mt-1" style={{ marginBottom: 0 }}>
          {LANDING_COPY.safety} Read the <Link to="/labs">Safe Labs rules</Link> or the safety boundaries in the docs.
        </p>
      </Panel>
    </div>
  )
}
