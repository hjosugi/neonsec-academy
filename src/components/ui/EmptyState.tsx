import type { ReactNode } from 'react'

interface EmptyStateProps {
  glyph?: string
  title: string
  hint?: string
  children?: ReactNode
}

export function EmptyState({ glyph = '◌', title, hint, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__glyph">{glyph}</div>
      <div className="display" style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
        {title}
      </div>
      {hint && <p className="muted mt-1" style={{ maxWidth: '42ch', margin: '0.5rem auto 0' }}>{hint}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}
