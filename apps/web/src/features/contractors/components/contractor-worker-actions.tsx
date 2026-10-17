import { Link } from 'react-router';
import { UserPlus, Users } from 'lucide-react';
import type { ContractorDto } from '@umc/shared';
import { contractorWorkersPath } from '@/config/routes';

export interface ContractorWorkerActionsProps {
  contractor: ContractorDto;
  /** Absent when the user may only view workers. */
  onAddWorker?: (contractor: ContractorDto) => void;
}

/** Opens a contractor's workers page, or adds a worker to it without leaving the list. */
export function ContractorWorkerActions({ contractor, onAddWorker }: ContractorWorkerActionsProps) {
  return (
    <div className="row-actions">
      <Link
        className="button button--small"
        to={contractorWorkersPath(contractor.id)}
        title={`View workers of ${contractor.name}`}
      >
        <Users size={14} aria-hidden />
        View workers
      </Link>
      {onAddWorker && (
        <button
          type="button"
          className="button button--small"
          title={`Add a worker to ${contractor.name}`}
          onClick={() => onAddWorker(contractor)}
        >
          <UserPlus size={14} aria-hidden />
          Add worker
        </button>
      )}
    </div>
  );
}
