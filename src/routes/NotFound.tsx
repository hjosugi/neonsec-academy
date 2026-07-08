import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="page">
      <div className="empty-state" style={{ paddingTop: '4rem' }}>
        <div className="glitch" data-text="404" style={{ fontSize: '4rem', fontFamily: 'var(--font-display)', fontWeight: 900 }}>
          404
        </div>
        <p className="muted mt-2">This district is off the grid.</p>
        <Link to="/" className="btn btn--primary mt-3">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
