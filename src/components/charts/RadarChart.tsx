import { clamp } from '../../lib/format'

export interface RadarPoint {
  label: string
  value: number // 0..1
}

export function RadarChart({
  points,
  size = 300,
  color = '#00f5ff',
}: {
  points: RadarPoint[]
  size?: number
  color?: string
}) {
  const n = points.length
  if (n < 3) return null
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 46
  const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, radius: number): [number, number] => [
    cx + radius * Math.cos(angleAt(i)),
    cy + radius * Math.sin(angleAt(i)),
  ]

  const rings = [0.25, 0.5, 0.75, 1]
  const dataPoly = points
    .map((p, i) => point(i, r * clamp(p.value, 0, 1)).join(','))
    .join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }} role="img" aria-label="Domain mastery radar">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={points.map((_, i) => point(i, r * ring).join(',')).join(' ')}
          fill="none"
          stroke="rgba(0,245,255,0.12)"
          strokeWidth={1}
        />
      ))}
      {points.map((_, i) => {
        const [x, y] = point(i, r)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,245,255,0.1)" strokeWidth={1} />
      })}
      <polygon points={dataPoly} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      {points.map((p, i) => {
        const [x, y] = point(i, r * clamp(p.value, 0, 1))
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />
      })}
      {points.map((p, i) => {
        const [x, y] = point(i, r + 20)
        const anchor = Math.abs(x - cx) < 6 ? 'middle' : x > cx ? 'start' : 'end'
        return (
          <text
            key={i}
            x={x}
            y={y}
            fontSize={10.5}
            fill="var(--text-muted)"
            textAnchor={anchor}
            dominantBaseline="middle"
            fontFamily="var(--font-term)"
          >
            {p.label}
          </text>
        )
      })}
    </svg>
  )
}
