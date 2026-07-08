import { Meter } from '../ui/Meter'
import { clamp } from '../../lib/format'

export interface BarRow {
  label: string
  value: number // 0..1, or -1 = not attempted
  color?: string
  sub?: string
  onClick?: () => void
}

export function StatBars({ rows }: { rows: BarRow[] }) {
  return (
    <div className="stack stack--sm">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`row ${r.onClick ? 'clickable' : ''}`}
          onClick={r.onClick}
          style={{ gap: '0.8rem' }}
        >
          <div style={{ width: '36%', minWidth: 110 }}>
            <div className="t-sm nowrap" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {r.label}
            </div>
            {r.sub && <div className="term t-xs dim">{r.sub}</div>}
          </div>
          <div className="grow">
            <Meter value={r.value < 0 ? 0 : r.value * 100} color={r.color} />
          </div>
          <div
            className="term t-sm nowrap tabnum"
            style={{ width: 46, textAlign: 'right', color: r.value < 0 ? 'var(--text-dim)' : 'var(--text-main)' }}
          >
            {r.value < 0 ? 'n/a' : `${Math.round(r.value * 100)}%`}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Sparkline({
  values,
  width = 180,
  height = 44,
  color = '#00f5ff',
}: {
  values: number[] // 0..100
  width?: number
  height?: number
  color?: string
}) {
  if (values.length === 0) return null
  const pts = values.map((v, i): [number, number] => {
    const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width
    const y = height - (clamp(v, 0, 100) / 100) * (height - 6) - 3
    return [x, y]
  })
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="Score trend">
      <path d={d} fill="none" stroke={color} strokeWidth={2} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 3.5 : 2} fill={color} />
      ))}
      <circle cx={last[0]} cy={last[1]} r={5} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />
    </svg>
  )
}
