import { useState } from 'react';
import { SearchX, UserPlus, Users } from 'lucide-react';
import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  type ContractorDto,
  type ContractorEmployeeDto,
  type Paginated,
} from '@umc/shared';
import { Pagination } from '@/components/data/pagination';
import { QueryResult } from '@/components/data/query-result';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { useApiQuery } from '@/hooks/use-api-query';
import { RESOURCE_API } from '@/lib/resource-api';
import { ContractorWorkerRow } from './contractor-worker-row';
import { ContractorWorkersSummary } from './contractor-workers-summary';
import { ContractorWorkersToolbar } from './contractor-workers-toolbar';

const STATUSES = Object.values(CONTRACTOR_EMPLOYEE_STATUSES);
const SKELETON_ROWS = ['a', 'b', 'c', 'd'];

export interface ContractorWorkersListProps {
  contractor: ContractorDto;
  deletingId?: string;
  onView: (worker: ContractorEmployeeDto) => void;
  /** The add, edit and delete handlers are absent when the user may not manage workers. */
  onAdd?: () => void;
  onEdit?: (worker: ContractorEmployeeDto) => void;
  onDelete?: (worker: ContractorEmployeeDto) => void;
}

function WorkerRowsSkeleton() {
  return (
    <ul className="worker-list" aria-hidden>
      {SKELETON_ROWS.map((key) => (
        <li key={key} className="worker-row worker-row--skeleton">
          <Skeleton circle width="2.5rem" height="2.5rem" />
          <div className="worker-row__identity">
            <Skeleton width="45%" height="0.875rem" />
            <Skeleton width="30%" height="0.75rem" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** A contractor's workers, searchable, filterable by status and paginated, for the workers panel. */
export function ContractorWorkersList({
  contractor,
  deletingId,
  onView,
  onAdd,
  onEdit,
  onDelete,
}: ContractorWorkersListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const list = useApiQuery<Paginated<ContractorEmployeeDto>>(
    RESOURCE_API.contractorEmployees.list({
      contractorId: contractor.id,
      page,
      search: search || undefined,
      status: STATUSES.find((option) => option === status),
    }),
  );
  const filtered = Boolean(search || status);

  return (
    <div className="worker-panel">
      <ContractorWorkersSummary contractor={contractor} />

      <section className="worker-panel__list" aria-label="Workers">
        <ContractorWorkersToolbar
          status={status}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          onStatusChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          onAdd={onAdd}
        />

        <QueryResult
          query={list}
          loading={
            <div className="card worker-list-card">
              <WorkerRowsSkeleton />
            </div>
          }
        >
          {(result) =>
            result.items.length === 0 ? (
              <div className="card worker-list-card">
                {filtered ? (
                  <EmptyState
                    compact
                    icon={SearchX}
                    title="No matching workers"
                    message="Try a different name, code or phone number, or change the status filter."
                  />
                ) : (
                  <EmptyState
                    compact
                    icon={Users}
                    title="No workers yet"
                    message={`Add each worker ${contractor.name} sends to your sites so you can give them work and pay them.`}
                    action={
                      onAdd && (
                        <button type="button" className="button button--primary" onClick={onAdd}>
                          <UserPlus size={16} aria-hidden />
                          Add first worker
                        </button>
                      )
                    }
                  />
                )}
              </div>
            ) : (
              <div className="card worker-list-card" aria-busy={list.loading}>
                <ul className="worker-list">
                  {result.items.map((worker) => (
                    <ContractorWorkerRow
                      key={worker.id}
                      worker={worker}
                      deleting={deletingId === worker.id}
                      onView={() => onView(worker)}
                      onEdit={onEdit && (() => onEdit(worker))}
                      onDelete={onDelete && (() => onDelete(worker))}
                    />
                  ))}
                </ul>
                <Pagination meta={result.meta} disabled={list.loading} onPageChange={setPage} />
              </div>
            )
          }
        </QueryResult>
      </section>
    </div>
  );
}
