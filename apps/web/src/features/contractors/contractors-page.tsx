import { HardHat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CONTRACTOR_STATUSES, type ContractorDto } from '@umc/shared';
import { ContactCell } from '@/components/data/contact-cell';
import type { DataTableColumn } from '@/components/data/data-table';
import { StatusBadge } from '@/components/data/status-badge';
import { ResourceListPage } from '@/components/pages/resource-list-page';
import { useCan } from '@/hooks/use-can';
import { RESOURCE_API } from '@/lib/resource-api';
import { humanizeEnum } from '@/utils/format';
import { ContractorDetails } from './components/contractor-details';
import { ContractorForm } from './components/contractor-form';
import { ContractorWorkerActions } from './components/contractor-worker-actions';
import { ContractorWorkersDrawer } from './components/contractor-workers-drawer';
import { ContractorWorkersContext } from './lib/contractor-workers-context';

const STATUSES = Object.values(CONTRACTOR_STATUSES);

interface WorkerColumnOptions {
  /** Absent when the user may not view workers; hides the workers column. */
  onViewWorkers?: (contractor: ContractorDto) => void;
  /** Absent when the user may not add workers. */
  onAddWorker?: (contractor: ContractorDto) => void;
}

function contractorColumns({
  onViewWorkers,
  onAddWorker,
}: WorkerColumnOptions): DataTableColumn<ContractorDto>[] {
  return [
    { id: 'name', header: 'Contractor', render: (contractor) => contractor.name },
    { id: 'category', header: 'Trade', render: (contractor) => humanizeEnum(contractor.category) },
    { id: 'contact', header: 'Contact', render: (contractor) => <ContactCell {...contractor} /> },
    {
      id: 'status',
      header: 'Status',
      mobile: 'aside',
      render: (contractor) => <StatusBadge status={contractor.status} />,
    },
    ...(onViewWorkers
      ? [
          {
            id: 'workers',
            header: 'Workers',
            render: (contractor: ContractorDto) => (
              <ContractorWorkerActions
                contractor={contractor}
                onViewWorkers={onViewWorkers}
                onAddWorker={onAddWorker}
              />
            ),
          },
        ]
      : []),
  ];
}

interface WorkersPanel {
  contractor: ContractorDto;
  startAdding: boolean;
}

export function ContractorsPage() {
  const canManage = useCan('manageContractors');
  const canViewWorkers = useCan('viewContractorEmployees');
  const canManageWorkers = useCan('manageContractorEmployees');
  const [workersPanel, setWorkersPanel] = useState<WorkersPanel | null>(null);

  const openWorkers = useMemo(
    () =>
      canViewWorkers
        ? (contractor: ContractorDto) => setWorkersPanel({ contractor, startAdding: false })
        : null,
    [canViewWorkers],
  );

  const columns = useMemo(
    () =>
      contractorColumns({
        onViewWorkers: openWorkers ?? undefined,
        onAddWorker: canManageWorkers
          ? (contractor) => setWorkersPanel({ contractor, startAdding: true })
          : undefined,
      }),
    [openWorkers, canManageWorkers],
  );

  return (
    <ContractorWorkersContext.Provider value={openWorkers}>
      <ResourceListPage<ContractorDto>
        title="Contractors"
        description={
          canViewWorkers
            ? 'Trade contractors and the workers they send to your sites.'
            : 'Trade contractors and their contact details.'
        }
        noun="contractor"
        api={RESOURCE_API.contractors}
        statuses={STATUSES}
        searchLabel="Name, email or phone"
        columns={columns}
        canManage={canManage}
        itemName={(contractor) => contractor.name}
        intro={{
          icon: HardHat,
          title: 'Add your first contractor',
          message:
            'Contractors are outside teams, like an electrician or plumber, who send their own workers to your sites.',
        }}
        Form={ContractorForm}
        Details={ContractorDetails}
      />

      {workersPanel && (
        <ContractorWorkersDrawer
          key={workersPanel.contractor.id}
          contractor={workersPanel.contractor}
          startAdding={workersPanel.startAdding}
          onClose={() => setWorkersPanel(null)}
        />
      )}
    </ContractorWorkersContext.Provider>
  );
}
