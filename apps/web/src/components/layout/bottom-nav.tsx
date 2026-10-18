import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { LayoutGrid } from 'lucide-react';
import { getVisibleBottomNavItems } from '@/config/bottom-nav';
import { useSession } from '@/features/auth';

interface BottomNavProps {
  /** Whether the full menu is showing; "More" is highlighted while it is. */
  menuOpen: boolean;
  onOpenMenu: () => void;
}

/** Tab bar fixed to the bottom of small screens: key pages, the main action, and "More". */
export function BottomNav({ menuOpen, onOpenMenu }: BottomNavProps) {
  const role = useSession().user?.role;
  const items = useMemo(() => getVisibleBottomNavItems(role), [role]);
  const { pathname } = useLocation();
  const onTab = items.some((item) => item.activePath === pathname);

  return (
    <nav className="bottom-nav" aria-label="Quick">
      <ul className="bottom-nav__list">
        {items.map(({ id, label, description, to, activePath, icon: Icon, primary }) => {
          const active = pathname === activePath;
          return (
            <li key={id} className="bottom-nav__item">
              <Link
                to={to}
                className={[
                  'bottom-nav__link',
                  primary && 'bottom-nav__link--primary',
                  active && 'bottom-nav__link--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-current={active ? 'page' : undefined}
                aria-label={label === description ? undefined : description}
              >
                <span className="bottom-nav__icon">
                  <Icon size={primary ? 24 : 22} strokeWidth={primary ? 2.5 : 2} aria-hidden />
                </span>
                <span className="bottom-nav__label">{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="bottom-nav__item">
          <button
            type="button"
            className={`bottom-nav__link${menuOpen || !onTab ? ' bottom-nav__link--active' : ''}`}
            onClick={onOpenMenu}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            <span className="bottom-nav__icon">
              <LayoutGrid size={22} aria-hidden />
            </span>
            <span className="bottom-nav__label">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
