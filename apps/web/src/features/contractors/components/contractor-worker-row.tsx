import { ChevronRight, Pencil, Phone, Trash2 } from 'lucide-react';
import { CONTRACTOR_EMPLOYEE_STATUSES, type ContractorEmployeeDto } from '@umc/shared';
import { StatusBadge } from '@/components/data/status-badge';
import { Spinner } from '@/components/feedback/spinner';
import { initials } from '@/utils/format';

export interface ContractorWorkerRowProps {
  worker: ContractorEmployeeDto;
  deleting: boolean;
  onView: () => void;
  /** Edit and delete are hidden when absent. */
  onEdit?: () => void;
  onDelete?: () => void;
}

/** One worker in the workers panel; the row opens their details. */
export function ContractorWorkerRow({
  worker,
  deleting,
  onView,
  onEdit,
  onDelete,
}: ContractorWorkerRowProps) {
  const inactive = worker.status !== CONTRACTOR_EMPLOYEE_STATUSES.ACTIVE;

  return (
    <li className={`worker-row${inactive ? ' worker-row--inactive' : ''}`}>
      <button
        type="button"
        className="worker-row__main"
        title={`View ${worker.name}`}
        onClick={onView}
      >
        <span className="worker-row__avatar" aria-hidden>
          {initials(worker.name)}
        </span>
        <span className="worker-row__identity">
          <span className="worker-row__name">{worker.name}</span>
          <span className="worker-row__meta">
            <span className="details__code">{worker.employeeCode}</span>
            {worker.phone && (
              <span className="worker-row__phone">
                <Phone size={12} aria-hidden />
                {worker.phone}
              </span>
            )}
          </span>
        </span>
        <StatusBadge status={worker.status} />
        <ChevronRight className="worker-row__chevron" size={18} aria-hidden />
      </button>
      {(onEdit || onDelete) && (
        <div className="worker-row__actions">
          {onEdit && (
            <button
              type="button"
              className="icon-button"
              title={`Edit ${worker.name}`}
              aria-label={`Edit worker ${worker.name}`}
              disabled={deleting}
              onClick={onEdit}
            >
              <Pencil size={16} aria-hidden />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="icon-button icon-button--danger"
              title={`Delete ${worker.name}`}
              aria-label={`Delete worker ${worker.name}`}
              disabled={deleting}
              onClick={onDelete}
            >
              {deleting ? <Spinner size={16} label="Deleting" /> : <Trash2 size={16} aria-hidden />}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
