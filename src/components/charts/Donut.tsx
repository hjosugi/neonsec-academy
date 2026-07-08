import { clamp } from '../../lib/format'

export function Donut({
  value,
  size = 150,
  stroke = 12,
  color = '#00f5ff',
  label,
  sublabel,
}: {
  value: number // 0..100
  size?: number
  stroke?: number
  color?: string
  label?: string
  sublabel?: string
}) {
  const r = size / 2 - stroke / 2 - 2
  const c = 2 * Math.PI * r
  const v = clamp(value, 0, 100)
  const offset = c * (1 - v / 100)

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--panel-inset)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeContent: 'center',
          textAlign: 'center',
        }}
      >
        <div className="display" style={{ fontSize: size / 4.2, fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
          {label ?? `${Math.round(v)}%`}
        </div>
        {sublabel && <div className="term t-xs dim" style={{ marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  )
}
