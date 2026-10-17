import { Trash2 } from 'lucide-react';
import { WORK_ASSIGNMENT_STATUSES, type WorkAssignmentDto } from '@umc/shared';
import { StatusBadge } from '@/components/data/status-badge';
import { Spinner } from '@/components/feedback/spinner';
import { Select, type SelectOption } from '@/components/forms/select';
import type { BoardAssignment } from '../lib/daily-board';

export interface AssignmentRowProps {
  item: BoardAssignment;
  /** Sites the worker can be moved to; omit for a read-only row. */
  moveTargets?: readonly SelectOption[];
  pending: boolean;
  onMove: (assignment: WorkAssignmentDto, siteId: string) => void;
  onRemove: (assignment: WorkAssignmentDto) => void;
}

/** Completed days are kept as attendance, so only scheduled or cancelled ones can be removed. */
export function AssignmentRow({
  item,
  moveTargets,
  pending,
  onMove,
  onRemove,
}: AssignmentRowProps) {
  const { assignment, worker, active } = item;
  const name = worker?.name ?? 'Unknown worker';
  const canManage = moveTargets !== undefined;
  const removable = assignment.status !== WORK_ASSIGNMENT_STATUSES.COMPLETED;

  return (
    <li className={`assignment-row${active ? '' : ' assignment-row--inactive'}`}>
      <div className="assignment-row__worker">
        <span className="assignment-row__name">{name}</span>
        <span className="assignment-row__meta">
          {worker ? `${worker.code} · ` : ''}
          {assignment.workType}
        </span>
      </div>
      {assignment.status !== WORK_ASSIGNMENT_STATUSES.SCHEDULED && (
        <StatusBadge status={assignment.status} />
      )}
      {canManage && (
        <div className="assignment-row__actions">
          {pending && <Spinner size={16} label="Saving" />}
          {active && moveTargets.length > 0 && (
            <Select
              className="select__trigger--compact"
              aria-label={`Move ${name} to another site`}
              placeholder="Move to…"
              required
              value=""
              options={moveTargets}
              disabled={pending}
              onChange={(siteId) => onMove(assignment, siteId)}
            />
          )}
          {removable && (
            <button
              type="button"
              className="icon-button assignment-row__remove"
              aria-label={`Remove ${name} from this site`}
              title="Remove"
              disabled={pending}
              onClick={() => onRemove(assignment)}
            >
              <Trash2 size={16} aria-hidden />
            </button>
          )}
        </div>
      )}
    </li>
  );
}
