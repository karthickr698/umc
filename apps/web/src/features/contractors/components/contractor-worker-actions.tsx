import { UserPlus, Users } from 'lucide-react';
import type { ContractorDto } from '@umc/shared';

export interface ContractorWorkerActionsProps {
  contractor: ContractorDto;
  onViewWorkers: (contractor: ContractorDto) => void;
  /** Absent when the user may only view workers. */
  onAddWorker?: (contractor: ContractorDto) => void;
}

/** Opens a contractor's workers panel, or its add-worker form, without leaving the list. */
export function ContractorWorkerActions({
  contractor,
  onViewWorkers,
  onAddWorker,
}: ContractorWorkerActionsProps) {
  return (
    <div className="row-actions">
      <button
        type="button"
        className="button button--small"
        title={`View workers of ${contractor.name}`}
        onClick={() => onViewWorkers(contractor)}
      >
        <Users size={14} aria-hidden />
        Workers
      </button>
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
