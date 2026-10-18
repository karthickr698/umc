import { WORK_ASSIGNMENT_STATUSES, type WorkAssignmentDto } from '@umc/shared';
import { Avatar } from '@/components/data/avatar';
import { StatusBadge } from '@/components/data/status-badge';
import { Spinner } from '@/components/feedback/spinner';
import { ConfirmButton } from '@/components/forms/confirm-button';
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
  const canMove = canManage && active && moveTargets.length > 0;

  return (
    <li className={`assignment-row${active ? '' : ' assignment-row--inactive'}`}>
      <Avatar name={name} size="small" muted={!active} />
      <div className="assignment-row__worker">
        <span className="assignment-row__name" title={name}>
          {name}
        </span>
        <span className="assignment-row__meta">
          <span className="assignment-row__work-type">{assignment.workType}</span>
          {worker && <span className="assignment-row__code">{worker.code}</span>}
          {assignment.status !== WORK_ASSIGNMENT_STATUSES.SCHEDULED && (
            <StatusBadge status={assignment.status} />
          )}
        </span>
      </div>
      {canManage && (
        <div className="assignment-row__actions">
          {pending && <Spinner size={16} label="Saving" />}
          {canMove && (
            <Select
              className="select__trigger--compact assignment-row__move"
              aria-label={`Move ${name} to another site`}
              placeholder="Move"
              required
              value=""
              options={moveTargets}
              disabled={pending}
              onChange={(siteId) => onMove(assignment, siteId)}
            />
          )}
          {removable && (
            <ConfirmButton
              className="button--small assignment-row__remove"
              label=""
              confirmLabel="Remove?"
              aria-label={`Remove ${name} from this site`}
              title="Remove from this site"
              pending={pending}
              pendingLabel="Removing"
              onConfirm={() => onRemove(assignment)}
            />
          )}
        </div>
      )}
    </li>
  );
}
