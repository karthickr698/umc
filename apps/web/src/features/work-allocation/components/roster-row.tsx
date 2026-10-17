import { Pencil } from 'lucide-react';
import { WORK_ASSIGNMENT_STATUSES, type SiteDto } from '@umc/shared';
import { StatusBadge } from '@/components/data/status-badge';
import { formatAmount } from '@/utils/format';
import type { RosterRow as RosterRowData } from '../lib/roster';
import { RosterStateBadge } from './roster-state-badge';

export interface RosterRowProps {
  row: RosterRowData;
  sitesById: ReadonlyMap<string, SiteDto>;
  showRate: boolean;
  canManage: boolean;
  onOpenWorker: () => void;
  onEdit: () => void;
}

export function RosterRow({
  row,
  sitesById,
  showRate,
  canManage,
  onOpenWorker,
  onEdit,
}: RosterRowProps) {
  const { worker, state, assignment } = row;
  const site = assignment && sitesById.get(assignment.siteId);
  const cancelled = assignment?.status === WORK_ASSIGNMENT_STATUSES.CANCELLED;

  return (
    <tr className={`roster-row roster-row--${state.toLowerCase()}`}>
      <td>
        <button type="button" className="roster-row__worker" onClick={onOpenWorker}>
          <span className="roster-row__name">{worker.name}</span>
          <span className="table__secondary">
            {worker.code} · {worker.role ?? 'Contractor worker'}
            {!worker.active && ' · Inactive'}
          </span>
        </button>
      </td>
      <td>
        <RosterStateBadge state={state} />
      </td>
      <td className={cancelled ? 'roster-row__assignment--cancelled' : undefined}>
        {assignment ? (
          <>
            <span className="roster-row__site">{site?.name ?? 'Unknown site'}</span>
            <span className="table__secondary">{assignment.workType}</span>
          </>
        ) : (
          <span className="table__secondary">Not assigned this day</span>
        )}
      </td>
      <td>{assignment && <StatusBadge status={assignment.status} />}</td>
      {showRate && (
        <td className="table__numeric">{assignment ? formatAmount(assignment.dailyRate) : '—'}</td>
      )}
      <td className="roster-row__actions">
        {canManage && assignment && (
          <button
            type="button"
            className="button button--small"
            aria-label={`Edit ${worker.name}'s assignment`}
            onClick={onEdit}
          >
            <Pencil size={14} aria-hidden />
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}
