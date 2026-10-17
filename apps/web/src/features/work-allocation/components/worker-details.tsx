import { Pencil } from 'lucide-react';
import {
  isActiveWorkAssignmentStatus,
  type SiteDto,
  type WorkAssignmentDto,
  type WorkerType,
} from '@umc/shared';
import { DescriptionList, type DescriptionItem } from '@/components/data/description-list';
import { QueryResult } from '@/components/data/query-result';
import { StatusBadge } from '@/components/data/status-badge';
import { Skeleton } from '@/components/feedback/skeleton';
import { formatAmount, formatCalendarDate, formatMonth, humanizeEnum } from '@/utils/format';
import { useWorkerDetail, type WorkerProfile } from '../hooks/use-worker-detail';
import type { RosterRow } from '../lib/roster';
import { siteLabel } from '@/lib/sites';
import { AssignmentHistory } from './assignment-history';
import { RosterStateBadge } from './roster-state-badge';

export interface WorkerDetailsProps {
  row: RosterRow;
  date: string;
  sitesById: ReadonlyMap<string, SiteDto>;
  canManage: boolean;
  onEdit: (assignment: WorkAssignmentDto) => void;
}

const DETAILS_SKELETON = (
  <div className="worker-details__loading" aria-hidden>
    <Skeleton height="1rem" />
    <Skeleton height="1rem" width="80%" />
    <Skeleton height="1rem" width="60%" />
  </div>
);

function profileItems(profile: WorkerProfile, workerType: WorkerType): DescriptionItem[] {
  return [
    { label: 'Code', value: profile.employeeCode },
    { label: 'Type', value: humanizeEnum(workerType) },
    ...('role' in profile ? [{ label: 'Role', value: profile.role }] : []),
    { label: 'Phone', value: profile.phone },
    { label: 'Daily rate', value: formatAmount(profile.dailyRate) },
    { label: 'Status', value: <StatusBadge status={profile.status} /> },
    ...('notes' in profile ? [{ label: 'Notes', value: profile.notes }] : []),
  ];
}

function daysBooked(assignments: readonly WorkAssignmentDto[]): string {
  const days = assignments.filter((item) => isActiveWorkAssignmentStatus(item.status)).length;
  return `${days} day${days === 1 ? '' : 's'} worked or scheduled`;
}

/** Profile, the chosen day's assignment and the month's assignments for one worker. */
export function WorkerDetails({ row, date, sitesById, canManage, onEdit }: WorkerDetailsProps) {
  const { profile, history } = useWorkerDetail(row.worker, date);
  const { assignment } = row;

  return (
    <div className="worker-details">
      <section className="worker-details__section">
        <h3 className="worker-details__heading">{formatCalendarDate(date)}</h3>
        <div className="worker-details__day">
          <RosterStateBadge state={row.state} />
          <div className="worker-details__day-text">
            {assignment ? (
              <>
                <span className="worker-details__site">
                  {siteLabel(sitesById.get(assignment.siteId))}
                </span>
                <span className="table__secondary">
                  {assignment.workType} · {formatAmount(assignment.dailyRate)} ·{' '}
                  {humanizeEnum(assignment.status)}
                </span>
              </>
            ) : (
              <span className="table__secondary">Not assigned to any site this day.</span>
            )}
          </div>
          {canManage && assignment && (
            <button
              type="button"
              className="button button--small"
              onClick={() => onEdit(assignment)}
            >
              <Pencil size={14} aria-hidden />
              Edit
            </button>
          )}
        </div>
      </section>

      <section className="worker-details__section">
        <h3 className="worker-details__heading">Profile</h3>
        <QueryResult query={profile} loading={DETAILS_SKELETON}>
          {(data) => <DescriptionList items={profileItems(data, row.worker.workerType)} />}
        </QueryResult>
      </section>

      <section className="worker-details__section">
        <h3 className="worker-details__heading">
          {formatMonth(date.slice(0, 7))}
          {history.data && (
            <span className="worker-details__subheading">{daysBooked(history.data)}</span>
          )}
        </h3>
        <QueryResult query={history} loading={DETAILS_SKELETON}>
          {(items) => (
            <AssignmentHistory
              assignments={items}
              sitesById={sitesById}
              currentDate={date}
              onEdit={canManage ? onEdit : undefined}
            />
          )}
        </QueryResult>
      </section>
    </div>
  );
}
