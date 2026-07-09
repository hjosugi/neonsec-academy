import { NavLink } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { NAV } from './nav'
import { useDueQueue } from '../../store/selectors'

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const dueCount = useDueQueue().length

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand">
        <ShieldCheck className="brand__mark" aria-hidden="true" strokeWidth={1.9} />
        <div>
          <div className="brand__name">NEONSEC</div>
          <div className="brand__tag">CEH Academy</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((section) => (
          <div key={section.section}>
            <div className="nav__section">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav__item ${isActive ? 'is-active' : ''}`}
                  onClick={onNavigate}
                >
                  <Icon className="nav__icon" aria-hidden="true" strokeWidth={1.85} />
                  <span>{item.label}</span>
                  {item.badge === 'due' && dueCount > 0 && <span className="nav__badge">{dueCount}</span>}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="nav__spacer" />
      <div className="nav__foot">
        <span className="led flicker" /> &nbsp;secure lab // synthetic data only
      </div>
    </aside>
  )
}
