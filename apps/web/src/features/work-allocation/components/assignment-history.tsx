import { Pencil } from 'lucide-react';
import type { SiteDto, WorkAssignmentDto } from '@umc/shared';
import { StatusBadge } from '@/components/data/status-badge';
import { formatCalendarDate } from '@/utils/format';

export interface AssignmentHistoryProps {
  assignments: readonly WorkAssignmentDto[];
  sitesById: ReadonlyMap<string, SiteDto>;
  /** Highlighted, e.g. the day chosen on the page. */
  currentDate: string;
  /** Omit for a read-only list. */
  onEdit?: (assignment: WorkAssignmentDto) => void;
}

export function AssignmentHistory({
  assignments,
  sitesById,
  currentDate,
  onEdit,
}: AssignmentHistoryProps) {
  if (assignments.length === 0) {
    return <p className="worker-details__empty">No assignments this month.</p>;
  }

  return (
    <ul className="assignment-history">
      {assignments.map((assignment) => (
        <li
          key={assignment.id}
          className={`assignment-history__item${assignment.date === currentDate ? ' assignment-history__item--current' : ''}`}
        >
          <div className="assignment-history__text">
            <span className="assignment-history__date">{formatCalendarDate(assignment.date)}</span>
            <span className="table__secondary">
              {sitesById.get(assignment.siteId)?.name ?? 'Unknown site'} · {assignment.workType}
            </span>
          </div>
          <StatusBadge status={assignment.status} />
          {onEdit && (
            <button
              type="button"
              className="icon-button assignment-history__edit"
              aria-label={`Edit assignment on ${formatCalendarDate(assignment.date)}`}
              title="Edit"
              onClick={() => onEdit(assignment)}
            >
              <Pencil size={14} aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
