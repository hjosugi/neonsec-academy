import { type MouseEvent, useMemo } from 'react'
import { renderMarkdown } from '../../lib/markdown'

export function Markdown({ source, className = '' }: { source: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(source), [source])

  const copyCode = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) return
    const button = target.closest<HTMLButtonElement>('.md-copy')
    if (!button) return

    const code = button.parentElement?.querySelector('pre code')
    const text = code?.textContent ?? ''
    if (!text || !navigator.clipboard?.writeText) return

    const previous = button.textContent ?? 'Copy'
    void navigator.clipboard.writeText(text).then(
      () => {
        button.textContent = 'Copied'
        window.setTimeout(() => {
          button.textContent = previous
        }, 1200)
      },
      () => {
        button.textContent = 'Copy failed'
        window.setTimeout(() => {
          button.textContent = previous
        }, 1200)
      },
    )
  }

  return <div className={`md ${className}`} onClick={copyCode} dangerouslySetInnerHTML={{ __html: html }} />
}
