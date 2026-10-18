import { HardHat, UserCheck, Users } from 'lucide-react';
import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  type ContractorDto,
  type ContractorEmployeeDto,
  type Paginated,
} from '@umc/shared';
import { DetailsProfile } from '@/components/data/details-profile';
import { StatCard } from '@/components/data/stat-card';
import { StatusBadge } from '@/components/data/status-badge';
import { useApiQuery } from '@/hooks/use-api-query';
import { RESOURCE_API } from '@/lib/resource-api';
import { humanizeEnum } from '@/utils/format';

function useWorkerCount(contractorId: string, status?: string) {
  const query = useApiQuery<Paginated<ContractorEmployeeDto>>(
    RESOURCE_API.contractorEmployees.list({ contractorId, status, pageSize: 1 }),
  );
  return { total: query.data?.meta.total, loading: query.data === undefined && query.loading };
}

/** Who the workers belong to and how many there are, above the workers list. */
export function ContractorWorkersSummary({ contractor }: { contractor: ContractorDto }) {
  const all = useWorkerCount(contractor.id);
  const active = useWorkerCount(contractor.id, CONTRACTOR_EMPLOYEE_STATUSES.ACTIVE);

  return (
    <>
      <DetailsProfile
        name={contractor.name}
        avatar={<HardHat size={24} />}
        meta={
          <>
            <StatusBadge status={contractor.status} />
            <span>{humanizeEnum(contractor.category)} contractor</span>
          </>
        }
      />
      <div className="details__stats">
        <StatCard
          icon={Users}
          tone="info"
          label="Total workers"
          value={all.total ?? '—'}
          loading={all.loading}
        />
        <StatCard
          icon={UserCheck}
          tone="positive"
          label="Active"
          value={active.total ?? '—'}
          loading={active.loading}
          hint={
            all.total !== undefined && active.total !== undefined
              ? `${all.total - active.total} inactive`
              : undefined
          }
        />
      </div>
    </>
  );
}
