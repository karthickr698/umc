import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Brand } from './brand';
import { Breadcrumbs } from './breadcrumbs';
import { UserMenu } from './user-menu';

interface TopNavProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileNav: () => void;
}

export function TopNav({ sidebarCollapsed, onToggleSidebar, onOpenMobileNav }: TopNavProps) {
  const ToggleIcon = sidebarCollapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <header className="top-nav">
      <button
        type="button"
        className="icon-button top-nav__menu-button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
      >
        <Menu size={20} aria-hidden />
      </button>
      <button
        type="button"
        className="icon-button top-nav__collapse-button"
        onClick={onToggleSidebar}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={sidebarCollapsed}
      >
        <ToggleIcon size={20} aria-hidden />
      </button>
      <div className="top-nav__brand">
        <Brand compact />
      </div>
      <div className="top-nav__breadcrumbs">
        <Breadcrumbs />
      </div>
      <div className="top-nav__actions">
        <UserMenu />
      </div>
    </header>
  );
}
