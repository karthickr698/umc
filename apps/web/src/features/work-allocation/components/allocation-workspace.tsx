import { useMemo } from 'react';
import type { WorkAssignmentDto } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { SectionCard } from '@/components/layout/section-card';
import type { ApiQuery } from '@/hooks/use-api-query';
import { formatCalendarDate } from '@/utils/format';
import { useAllocationActions } from '../hooks/use-allocation-actions';
import type { AllocationReference } from '../hooks/use-allocation-data';
import type { AllocationParams } from '../hooks/use-allocation-params';
import { groupBySite, occupiedWorkers } from '../lib/daily-board';
import { workerCount } from '../lib/notices';
import { toSiteOptions } from '@/lib/sites';
import { workTypeSuggestions } from '../lib/work-types';
import { AllocationNoticeAlert } from './allocation-notice-alert';
import { AssignPanel } from './assign-panel';
import { DailyBoard } from './daily-board';
import { DailyBoardSkeleton } from './daily-board-skeleton';
import { DayPicker } from './day-picker';

export interface AllocationWorkspaceProps {
  params: AllocationParams;
  reference: AllocationReference;
  daily: ApiQuery<WorkAssignmentDto[]>;
  /** Without it the day is shown read-only. */
  canManage: boolean;
}

export function AllocationWorkspace({
  params,
  reference,
  daily,
  canManage,
}: AllocationWorkspaceProps) {
  const { date, setDate, setSiteId } = params;
  const actions = useAllocationActions(date, reference);
  const assignments = daily.data;

  const occupied = useMemo(() => assignments && occupiedWorkers(assignments), [assignments]);
  const suggestions = useMemo(
    () => workTypeSuggestions(reference.workers, assignments ?? []),
    [reference.workers, assignments],
  );
  const siteOptions = useMemo(
    () => toSiteOptions(reference.assignableSites),
    [reference.assignableSites],
  );
  // A stale or hand-edited URL may name a site that can't take workers.
  const siteId = siteOptions.some((option) => option.value === params.siteId) ? params.siteId : '';

  const freeCount = occupied
    ? reference.workers.filter((worker) => worker.active && !occupied.has(worker.key)).length
    : undefined;
  const summary =
    occupied && freeCount !== undefined
      ? `${workerCount(occupied.size)} assigned · ${freeCount} still free`
      : undefined;

  return (
    <div className="stack">
      {actions.notice && (
        <AllocationNoticeAlert notice={actions.notice} onDismiss={actions.dismissNotice} />
      )}

      <div className={`allocation${canManage ? '' : ' allocation--read-only'}`}>
        {canManage && (
          <AssignPanel
            date={date}
            siteId={siteId}
            onDateChange={setDate}
            onSiteChange={setSiteId}
            siteOptions={siteOptions}
            reference={reference}
            occupied={occupied}
            workTypeSuggestions={suggestions}
            assigning={actions.assigning}
            pendingIds={actions.pendingIds}
            onAssign={actions.assignWorkers}
            onMoveHere={(assignment, targetSiteId) =>
              void actions.moveAssignment(assignment, targetSiteId)
            }
          />
        )}

        <SectionCard
          title={`Assignments · ${formatCalendarDate(date)}`}
          description={summary}
          busy={daily.loading}
          actions={canManage ? undefined : <DayPicker value={date} onChange={setDate} />}
          className="allocation__board"
        >
          <QueryResult query={daily} loading={<DailyBoardSkeleton />}>
            {(list) => (
              <DailyBoard
                groups={groupBySite(list, reference.sitesById, reference.workersByKey)}
                currentSiteId={siteId}
                siteOptions={canManage ? siteOptions : undefined}
                pendingIds={actions.pendingIds}
                onMove={(assignment, targetSiteId) =>
                  void actions.moveAssignment(assignment, targetSiteId)
                }
                onRemove={(assignment) => void actions.removeAssignment(assignment)}
              />
            )}
          </QueryResult>
        </SectionCard>
      </div>
    </div>
  );
}
