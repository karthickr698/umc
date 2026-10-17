import { NavLink } from 'react-router';
import { matchesNavPathExactly, type NavSection } from '@/config/navigation';

interface SidebarNavProps {
  sections: readonly NavSection[];
  /** Icon-only mode; labels stay available to screen readers and as tooltips. */
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ sections, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav className="sidebar-nav" aria-label="Main">
      {sections.map((section) => (
        <div key={section.id} className="sidebar-nav__section">
          <p className="sidebar-nav__heading">{section.label}</p>
          <ul className="sidebar-nav__list">
            {section.items.map(({ id, label, path, icon: Icon }) => (
              <li key={id}>
                <NavLink
                  to={path}
                  end={matchesNavPathExactly(path)}
                  className={({ isActive }) =>
                    `sidebar-nav__link${isActive ? ' sidebar-nav__link--active' : ''}`
                  }
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                >
                  <Icon className="sidebar-nav__icon" size={18} aria-hidden />
                  <span className="sidebar-nav__label">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
