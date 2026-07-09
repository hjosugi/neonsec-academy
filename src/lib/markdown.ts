// Minimal, XSS-safe markdown → HTML for question bodies & explanations.
// Escapes first, then applies a limited, known-safe subset.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim()
  if (!trimmed.includes('|')) return []
  const body = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  return body.split('|').map((cell) => cell.trim())
}

function isTableDivider(line: string): boolean {
  const cells = parseTableRow(line)
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function isTableStart(lines: string[], i: number): boolean {
  if (i + 1 >= lines.length || !isTableDivider(lines[i + 1])) return false
  const header = parseTableRow(lines[i])
  const divider = parseTableRow(lines[i + 1])
  return header.length >= 2 && header.length === divider.length
}

function isCalloutLine(line: string): boolean {
  return /^\s*&gt;\s?/.test(line)
}

function calloutType(raw: string): { type: string; title: string } {
  const safe = raw.toLowerCase()
  if (safe === 'warning' || safe === 'caution') return { type: 'warning', title: 'Warning' }
  if (safe === 'important') return { type: 'important', title: 'Important' }
  if (safe === 'tip') return { type: 'tip', title: 'Tip' }
  return { type: 'note', title: 'Note' }
}

export function renderMarkdown(src: string): string {
  if (!src) return ''
  const escaped = escapeHtml(src)
  const lines = escaped.split('\n')
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // fenced code block
    if (line.trim().startsWith('```')) {
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i])
        i++
      }
      if (i < lines.length) i++ // closing fence
      out.push(`<div class="md-code"><button class="md-copy" type="button">Copy</button><pre><code>${buf.join('\n')}</code></pre></div>`)
      continue
    }

    // pipe table
    if (isTableStart(lines, i)) {
      const header = parseTableRow(lines[i])
      i += 2 // divider line
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim() !== '' && parseTableRow(lines[i]).length === header.length) {
        rows.push(parseTableRow(lines[i]))
        i++
      }
      out.push(
        `<div class="md-table"><table><thead><tr>${header
          .map((cell) => `<th>${inline(cell)}</th>`)
          .join('')}</tr></thead><tbody>${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      )
      continue
    }

    // callout blockquote, e.g. > [!NOTE]
    if (isCalloutLine(line)) {
      const buf: string[] = []
      while (i < lines.length && isCalloutLine(lines[i])) {
        buf.push(lines[i].replace(/^\s*&gt;\s?/, ''))
        i++
      }

      let title = 'Note'
      let type = 'note'
      const first = buf[0]?.trim() ?? ''
      const marker = first.match(/^\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]\s*(.*)$/i)
      if (marker) {
        const meta = calloutType(marker[1])
        type = meta.type
        title = marker[2]?.trim() || meta.title
        buf.shift()
      }

      const body = buf
        .join('\n')
        .split(/\n\s*\n/)
        .filter((part) => part.trim() !== '')
        .map((part) => `<p>${inline(part.split('\n').join('<br>'))}</p>`)
        .join('')
      out.push(`<aside class="md-callout md-callout--${type}"><p class="md-callout__title">${inline(title)}</p>${body}</aside>`)
      continue
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    // blank line
    if (line.trim() === '') {
      i++
      continue
    }

    // paragraph (consume until blank / block start)
    const para: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith('```') &&
      !isTableStart(lines, i) &&
      !isCalloutLine(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    out.push(`<p>${inline(para.join('<br>'))}</p>`)
  }

  return out.join('')
}
