import type { NavSection } from '@/config/navigation';
import { Brand } from './brand';
import { SidebarNav } from './sidebar-nav';

interface SidebarProps {
  sections: readonly NavSection[];
  collapsed: boolean;
}

/** Desktop-only sidebar; below the breakpoint `MobileNav` takes over. */
export function Sidebar({ sections, collapsed }: SidebarProps) {
  return (
    <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
      <div className="sidebar__header">
        <Brand compact={collapsed} />
      </div>
      <div className="sidebar__body">
        <SidebarNav sections={sections} collapsed={collapsed} />
      </div>
    </aside>
  );
}
