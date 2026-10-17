import { hasRole, ROLE_ACCESS } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { PageContainer } from '@/components/layout/page-container';
import { useSession } from '@/features/auth';
import { ScheduleWorkspace } from './components/schedule-workspace';
import { useAllocationData } from './hooks/use-allocation-data';
import { useAllocationParams } from './hooks/use-allocation-params';

export function WorkSchedulePage() {
  const { user } = useSession();
  const canManage = Boolean(user && hasRole(user.role, ROLE_ACCESS.manageWorkAssignments));
  const params = useAllocationParams();
  const { reference, daily } = useAllocationData(params.date);

  return (
    <PageContainer
      title="Work Schedule"
      description="See who works where each day, and who is still free."
    >
      <QueryResult query={reference}>
        {(data) => (
          <ScheduleWorkspace params={params} reference={data} daily={daily} canManage={canManage} />
        )}
      </QueryResult>
    </PageContainer>
  );
}
