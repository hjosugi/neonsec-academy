import type { CSSProperties } from 'react'
import { clamp } from '../../lib/format'

interface MeterProps {
  value: number // 0..100
  color?: string
  tall?: boolean
  className?: string
}

export function Meter({ value, color = 'var(--border-cyan)', tall, className = '' }: MeterProps) {
  const style = { '--v': `${clamp(value, 0, 100)}%`, '--c': color } as CSSProperties
  return (
    <div className={`meter ${tall ? 'meter--tall' : ''} ${className}`} style={style} role="meter" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="meter__fill" />
    </div>
  )
}
