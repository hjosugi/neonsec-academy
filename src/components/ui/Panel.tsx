import type { CSSProperties, ReactNode } from 'react'

interface PanelProps {
  title?: ReactNode
  right?: ReactNode
  brackets?: boolean
  pad?: 'lg'
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function Panel({ title, right, brackets, pad, className = '', style, children }: PanelProps) {
  const cls = ['panel', brackets ? 'panel--brackets' : '', pad === 'lg' ? 'panel--pad-lg' : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <section className={cls} style={style}>
      {(title || right) && (
        <div className="panel__head">
          {title ? <h3 className="panel__title">{title}</h3> : <span />}
          {right}
        </div>
      )}
      {children}
    </section>
  )
}
