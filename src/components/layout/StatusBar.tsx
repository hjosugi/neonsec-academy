import { Link } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { useDueQueue, useRank, useReadiness } from '../../store/selectors'

const BAND_COLOR = { green: 'neon-green', amber: 'neon-amber', red: 'neon-red' } as const

export function StatusBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const xp = useStore((s) => s.profile.xp)
  const streak = useStore((s) => s.profile.streakDays)
  const { rank, next } = useRank()
  const due = useDueQueue().length
  const readiness = useReadiness()

  const toNext = next ? Math.round(((xp - rank.min) / (next.min - rank.min)) * 100) : 100

  return (
    <header className="statusbar">
      <button className="btn btn--ghost btn--sm menu-btn" onClick={onMenu} aria-label="Menu">
        ≡
      </button>

      <div className="statusbar__seg hide-sm">
        <span className="led flicker" />
        <span className="val">ONLINE</span>
      </div>

      <div className="statusbar__spacer" />

      <Link to="/analytics" className="statusbar__seg hide-sm link-reset" title="Exam readiness">
        READINESS <span className={BAND_COLOR[readiness.band]}>{readiness.score}%</span>
      </Link>

      <Link to="/review" className="statusbar__seg link-reset" title="Reviews due today">
        DUE <span className="val" style={{ color: due > 0 ? 'var(--warning-amber)' : undefined }}>{due}</span>
      </Link>

      <div className="statusbar__seg hide-sm" title="Study streak">
        STREAK <span className="val">{streak}d</span>
      </div>

      <div className="rank-pill" title={`${xp} XP · ${toNext}% to ${next?.title ?? 'max'}`}>
        <span>{rank.glyph}</span>
        <span className="hide-sm">{rank.title}</span>
        <span className="tabnum">{xp}</span>
      </div>

      <button className="btn btn--ghost btn--sm" onClick={onSearch} aria-label="Command palette">
        ⌕ <span className="kbd hide-sm">/</span>
      </button>
    </header>
  )
}
