import { useCallback, useState } from 'react';
import { Outlet } from 'react-router';
import { NavigationProgress } from '@/components/feedback/navigation-progress';
import { DESKTOP_MEDIA_QUERY, STORAGE_KEYS } from '@/config/layout';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useNavSections } from '@/hooks/use-nav-sections';
import { usePersistentBoolean } from '@/hooks/use-persistent-boolean';
import { MobileNav } from './mobile-nav';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

export function AppLayout() {
  const sections = useNavSections();
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentBoolean(
    STORAGE_KEYS.sidebarCollapsed,
    false,
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <NavigationProgress />
      <Sidebar sections={sections} collapsed={sidebarCollapsed} />
      <MobileNav sections={sections} open={mobileNavOpen && !isDesktop} onClose={closeMobileNav} />
      <div className="app-layout__main">
        <TopNav
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileNav={openMobileNav}
        />
        <main id="main-content" className="app-layout__content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
