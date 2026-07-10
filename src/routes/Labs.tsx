import { Link } from 'react-router-dom'
import { LABS } from '../data/labs'
import { PageHeader } from '../components/ui/PageHeader'
import { Panel } from '../components/ui/Panel'

export function Labs() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Practical // Safe Labs"
        title="Safe Labs"
        sub="CEH-Practical-style hands-on judgment — built entirely from synthetic, local, read-only material."
      />

      <Panel className="mb-3" brackets>
        <div className="panel__title" style={{ color: 'var(--acid-green)' }}>
          <span style={{ background: 'var(--acid-green)', boxShadow: 'var(--glow-green)' }} /> Sandbox rules
        </div>
        <p className="t-sm muted mt-1">
          Every lab is a static analysis + report exercise. There are <strong>no real targets</strong>, no scanning, no
          exploits, no credentials — you read synthetic evidence, reason like an analyst, and write findings. This mirrors
          how you prove skill safely.
        </p>
      </Panel>

      <div className="grid-cards">
        {LABS.map((lab) => (
          <Link key={lab.id} to={`/labs/${lab.id}`} className="neon-card">
            <div className="row row--between">
              <span style={{ fontSize: '1.6rem', color: lab.color }}>{lab.glyph}</span>
              <span className={`diff diff--${lab.difficulty}`}>◆ {lab.difficulty}</span>
            </div>
            <h3 className="display mt-1" style={{ fontSize: '1rem' }}>
              {lab.title}
            </h3>
            <span className="badge mt-1" style={{ borderColor: lab.color, color: lab.color }}>
              {lab.category}
            </span>
            <span className="badge mt-1" style={{ marginLeft: '0.35rem' }}>
              {lab.kind}
            </span>
            <p className="term t-xs dim mt-2" style={{ lineHeight: 1.5 }}>
              {lab.brief.length > 120 ? lab.brief.slice(0, 118) + '…' : lab.brief}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
