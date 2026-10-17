import { HardHat } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { CONTRACTOR_STATUSES, type ContractorDto } from '@umc/shared';
import { ContactCell } from '@/components/data/contact-cell';
import type { DataTableColumn } from '@/components/data/data-table';
import { StatusBadge } from '@/components/data/status-badge';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { Drawer } from '@/components/layout/drawer';
import { ResourceListPage } from '@/components/pages/resource-list-page';
import { contractorWorkersPath } from '@/config/routes';
import { useCan } from '@/hooks/use-can';
import { RESOURCE_API } from '@/lib/resource-api';
import { humanizeEnum } from '@/utils/format';
import { ContractorEmployeeForm } from './components/contractor-employee-form';
import { ContractorForm } from './components/contractor-form';
import { ContractorWorkerActions } from './components/contractor-worker-actions';

const STATUSES = Object.values(CONTRACTOR_STATUSES);

interface WorkerColumnOptions {
  /** Whether names link to, and a column offers, the contractor's workers. */
  showWorkers: boolean;
  /** Absent when the user may not add workers. */
  onAddWorker?: (contractor: ContractorDto) => void;
}

function contractorColumns({
  showWorkers,
  onAddWorker,
}: WorkerColumnOptions): DataTableColumn<ContractorDto>[] {
  return [
    {
      id: 'name',
      header: 'Contractor',
      render: (contractor) =>
        showWorkers ? (
          <Link className="text-link" to={contractorWorkersPath(contractor.id)}>
            {contractor.name}
          </Link>
        ) : (
          contractor.name
        ),
    },
    { id: 'category', header: 'Trade', render: (contractor) => humanizeEnum(contractor.category) },
    { id: 'contact', header: 'Contact', render: (contractor) => <ContactCell {...contractor} /> },
    {
      id: 'status',
      header: 'Status',
      render: (contractor) => <StatusBadge status={contractor.status} />,
    },
    ...(showWorkers
      ? [
          {
            id: 'workers',
            header: 'Workers',
            render: (contractor: ContractorDto) => (
              <ContractorWorkerActions contractor={contractor} onAddWorker={onAddWorker} />
            ),
          },
        ]
      : []),
  ];
}

export function ContractorsPage() {
  const canManage = useCan('manageContractors');
  const canViewWorkers = useCan('viewContractorEmployees');
  const canManageWorkers = useCan('manageContractorEmployees');
  const [addingTo, setAddingTo] = useState<ContractorDto | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const columns = useMemo(
    () =>
      contractorColumns({
        showWorkers: canViewWorkers,
        onAddWorker: canManageWorkers
          ? (contractor) => {
              setAddedNotice(null);
              setAddingTo(contractor);
            }
          : undefined,
      }),
    [canViewWorkers, canManageWorkers],
  );

  return (
    <>
      <ResourceListPage<ContractorDto>
        title="Contractors"
        description={
          canViewWorkers
            ? 'Trade contractors; view or add the workers they supply.'
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
        banner={
          addedNotice && (
            <InlineAlert tone="success" title="Done" onDismiss={() => setAddedNotice(null)}>
              {addedNotice}
            </InlineAlert>
          )
        }
      />

      <Drawer
        open={addingTo !== null}
        title="Add worker"
        description={addingTo?.name}
        onClose={() => setAddingTo(null)}
      >
        {addingTo && (
          <ContractorEmployeeForm
            key={addingTo.id}
            contractorId={addingTo.id}
            onSaved={(worker) => {
              setAddedNotice(`Added worker "${worker.name}" to ${addingTo.name}.`);
              setAddingTo(null);
            }}
            onCancel={() => setAddingTo(null)}
          />
        )}
      </Drawer>
    </>
  );
}
