import { hasRole, ROLE_ACCESS } from '@umc/shared';
import { PageContainer } from '@/components/layout/page-container';
import { useSession } from '@/features/auth';
import { DashboardOverview } from './components/dashboard-overview';
import { GettingStarted } from './components/getting-started';
import { QuickLinks } from './quick-links';
import { SystemStatusCard } from './system-status-card';

export function DashboardPage() {
  const { user } = useSession();
  const firstName = user?.name.split(' ')[0];
  const description = firstName
    ? `Welcome back, ${firstName}.`
    : 'Overview of your construction business.';

  // The money overview is limited to roles the API lets read it; others get the general view.
  if (user && hasRole(user.role, ROLE_ACCESS.viewDashboard)) {
    return <DashboardOverview description={description} />;
  }

  return (
    <PageContainer title="Dashboard" description={description}>
      <div className="stack">
        <GettingStarted />
        <SystemStatusCard />
        <QuickLinks />
      </div>
    </PageContainer>
  );
}
