import { useMemo } from 'react';
import type { WorkAssignmentDto } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { SectionCard } from '@/components/layout/section-card';
import type { ApiQuery } from '@/hooks/use-api-query';
import { toSiteOptions } from '@/lib/sites';
import { useAllocationActions } from '../hooks/use-allocation-actions';
import type { AllocationReference } from '../hooks/use-allocation-data';
import type { AllocationParams } from '../hooks/use-allocation-params';
import { groupBySite, occupiedWorkers } from '../lib/daily-board';
import { workTypeSuggestions } from '../lib/work-types';
import { AllocationNoticeAlert } from './allocation-notice-alert';
import { AssignPanel } from './assign-panel';
import { DailyBoard } from './daily-board';
import { DailyBoardSkeleton } from './daily-board-skeleton';
import { DayBar, type DayStat } from './day-bar';

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
  const groups = useMemo(
    () => assignments && groupBySite(assignments, reference.sitesById, reference.workersByKey),
    [assignments, reference.sitesById, reference.workersByKey],
  );
  const suggestions = useMemo(
    () => workTypeSuggestions(reference.workers, assignments ?? []),
    [reference.workers, assignments],
  );
  const siteOptions = useMemo(
    () => toSiteOptions(reference.assignableSites),
    [reference.assignableSites],
  );
  const sites = useMemo(
    () => [...reference.assignableSites].sort((a, b) => a.name.localeCompare(b.name)),
    [reference.assignableSites],
  );
  const assignedCounts = useMemo(
    () => groups && new Map(groups.map((group) => [group.siteId, group.activeCount])),
    [groups],
  );
  // A stale or hand-edited URL may name a site that can't take workers.
  const siteId = siteOptions.some((option) => option.value === params.siteId) ? params.siteId : '';

  const freeCount =
    occupied &&
    reference.workers.filter((worker) => worker.active && !occupied.has(worker.key)).length;
  const stats: DayStat[] = [
    { label: 'Assigned', value: occupied?.size, tone: 'ok' },
    { label: 'Still free', value: freeCount, tone: freeCount ? 'warn' : undefined },
    { label: 'Sites in use', value: groups?.filter((group) => group.activeCount > 0).length },
  ];

  return (
    <div className="stack">
      <DayBar date={date} onDateChange={setDate} stats={stats} />

      {actions.notice && (
        <AllocationNoticeAlert notice={actions.notice} onDismiss={actions.dismissNotice} />
      )}

      <div className={`allocation${canManage ? '' : ' allocation--read-only'}`}>
        {canManage && (
          <AssignPanel
            date={date}
            siteId={siteId}
            onSiteChange={setSiteId}
            sites={sites}
            assignedCounts={assignedCounts}
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
          title="Assigned workers"
          description="Everyone working on this day, grouped by site."
          busy={daily.loading}
          className="allocation__board"
        >
          <QueryResult query={daily} loading={<DailyBoardSkeleton />}>
            {() => (
              <DailyBoard
                groups={groups ?? []}
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
