import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('escapes unsafe HTML before rendering Markdown', () => {
    const html = renderMarkdown('<script>alert(1)</script> **safe**')

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('<strong>safe</strong>')
  })

  it('renders fenced code blocks with a code-only copy button', () => {
    const html = renderMarkdown('Use `inline`.\n\n```text\nGET /health\n```\n\nDone')

    expect(html).toContain('<code>inline</code>')
    expect(html).toContain('class="md-copy"')
    expect(html).toContain('<pre><code>GET /health</code></pre>')
    expect(html.match(/class="md-copy"/g)).toHaveLength(1)
  })

  it('renders pipe tables', () => {
    const html = renderMarkdown('| Signal | Meaning |\n|---|---|\n| 401 | Auth failure |\n| 200 | Success |')

    expect(html).toContain('<div class="md-table"><table>')
    expect(html).toContain('<th>Signal</th>')
    expect(html).toContain('<td>Auth failure</td>')
  })

  it('renders callouts from blockquotes', () => {
    const html = renderMarkdown('> [!WARNING] Synthetic only\n> Do not use real customer logs.')

    expect(html).toContain('class="md-callout md-callout--warning"')
    expect(html).toContain('<p class="md-callout__title">Synthetic only</p>')
    expect(html).toContain('Do not use real customer logs.')
  })
})
