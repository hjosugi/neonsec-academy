import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, sub, actions }: PageHeaderProps) {
  return (
    <div className="page__head">
      <div className="row row--between wrap" style={{ gap: '1rem', alignItems: 'flex-start' }}>
        <div>
          {eyebrow && <div className="page__eyebrow">{eyebrow}</div>}
          <h1 className="page__title">{title}</h1>
          {sub && <p className="page__sub">{sub}</p>}
        </div>
        {actions && <div className="row wrap" style={{ gap: '0.5rem' }}>{actions}</div>}
      </div>
    </div>
  )
}
