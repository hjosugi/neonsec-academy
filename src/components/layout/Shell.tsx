import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { CommandPalette } from './CommandPalette'

export function Shell() {
  const [navOpen, setNavOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const demoActive = useStore((s) => s.demo.active)
  const exitDemo = useStore((s) => s.exitDemo)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      } else if (e.key === '/' && !typing && !paletteOpen) {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paletteOpen])

  return (
    <div className="shell">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(3,5,16,0.6)', zIndex: 50 }}
        />
      )}
      <StatusBar onMenu={() => setNavOpen((o) => !o)} onSearch={() => setPaletteOpen(true)} />
      <main className="main">
        {demoActive && (
          <div className="demo-banner" role="status">
            <span>Demo mode — you are viewing a synthetic learner. Your own progress is parked locally.</span>
            <span className="row" style={{ gap: '0.4rem' }}>
              <Link className="btn btn--ghost btn--sm" to="/welcome">Tour</Link>
              <button className="btn btn--primary btn--sm" onClick={() => exitDemo()}>Exit demo</button>
            </span>
          </div>
        )}
        <Outlet />
      </main>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  )
}
