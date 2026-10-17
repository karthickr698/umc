import { Users } from 'lucide-react';
import { useParams } from 'react-router';
import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  type ContractorDto,
  type ContractorEmployeeDto,
} from '@umc/shared';
import type { DataTableColumn } from '@/components/data/data-table';
import { QueryResult } from '@/components/data/query-result';
import { StackedCell } from '@/components/data/stacked-cell';
import { StatusBadge } from '@/components/data/status-badge';
import { ResourceListPage } from '@/components/pages/resource-list-page';
import { useApiQuery } from '@/hooks/use-api-query';
import { useCan } from '@/hooks/use-can';
import { RESOURCE_API } from '@/lib/resource-api';
import { employeeOption } from '@/lib/select-options';
import { humanizeEnum } from '@/utils/format';
import { ContractorEmployeeForm } from './components/contractor-employee-form';

const STATUSES = Object.values(CONTRACTOR_EMPLOYEE_STATUSES);

const COLUMNS: readonly DataTableColumn<ContractorEmployeeDto>[] = [
  {
    id: 'name',
    header: 'Worker',
    render: (worker) => <StackedCell primary={worker.name} secondary={worker.employeeCode} />,
  },
  { id: 'phone', header: 'Phone', render: (worker) => worker.phone || '—' },
  { id: 'status', header: 'Status', render: (worker) => <StatusBadge status={worker.status} /> },
];

function ContractorWorkers({ contractor }: { contractor: ContractorDto }) {
  const canManage = useCan('manageContractorEmployees');

  return (
    <ResourceListPage<ContractorEmployeeDto>
      title={contractor.name}
      description={`${humanizeEnum(contractor.category)} contractor · workers they supply.`}
      noun="worker"
      api={RESOURCE_API.contractorEmployees}
      scope={{ contractorId: contractor.id }}
      statuses={STATUSES}
      searchLabel="Name, code or phone"
      columns={COLUMNS}
      canManage={canManage}
      itemName={(worker) => employeeOption(worker).label}
      intro={{
        icon: Users,
        title: "Add this contractor's workers",
        message:
          'Add each worker this contractor sends to your sites so you can give them work and pay them.',
      }}
      Form={ContractorEmployeeForm}
    />
  );
}

export function ContractorWorkersPage() {
  const { contractorId = '' } = useParams();
  const query = useApiQuery<ContractorDto>(RESOURCE_API.contractors.byId(contractorId));

  return (
    <QueryResult query={query}>
      {(contractor) => <ContractorWorkers contractor={contractor} />}
    </QueryResult>
  );
}
