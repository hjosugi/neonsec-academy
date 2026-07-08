import { NavLink } from 'react-router-dom'
import { NAV } from './nav'
import { useDueQueue } from '../../store/selectors'

export function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const dueCount = useDueQueue().length

  return (
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand">
        <span className="brand__mark">◉</span>
        <div>
          <div className="brand__name">NEONSEC</div>
          <div className="brand__tag">CEH Academy</div>
        </div>
      </div>

      <nav className="nav">
        {NAV.map((section) => (
          <div key={section.section}>
            <div className="nav__section">{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav__item ${isActive ? 'is-active' : ''}`}
                onClick={onNavigate}
              >
                <span className="nav__icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge === 'due' && dueCount > 0 && <span className="nav__badge">{dueCount}</span>}
              </NavLink>
            ))}
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
