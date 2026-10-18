import { hasRole, ROLE_ACCESS } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { PageContainer } from '@/components/layout/page-container';
import { useSession } from '@/features/auth';
import { AllocationWorkspace } from './components/allocation-workspace';
import { useAllocationData } from './hooks/use-allocation-data';
import { useAllocationParams } from './hooks/use-allocation-params';

export function WorkAllocationPage() {
  const { user } = useSession();
  const canManage = Boolean(user && hasRole(user.role, ROLE_ACCESS.manageWorkAssignments));
  const params = useAllocationParams();
  const { reference, daily } = useAllocationData(params.date);

  return (
    <PageContainer
      title="Assign Work"
      description="Pick a day, choose a site, and tick the workers who will go there."
    >
      <QueryResult query={reference}>
        {(data) => (
          <AllocationWorkspace
            params={params}
            reference={data}
            daily={daily}
            canManage={canManage}
          />
        )}
      </QueryResult>
    </PageContainer>
  );
}
