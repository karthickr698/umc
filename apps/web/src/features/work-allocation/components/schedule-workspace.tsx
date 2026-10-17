import { useMemo, useState } from 'react';
import type { WorkAssignmentDto } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { Skeleton } from '@/components/feedback/skeleton';
import { SectionCard } from '@/components/layout/section-card';
import type { ApiQuery } from '@/hooks/use-api-query';
import { formatCalendarDate } from '@/utils/format';
import type { AllocationReference } from '../hooks/use-allocation-data';
import type { AllocationParams } from '../hooks/use-allocation-params';
import { useMonthAssignments } from '../hooks/use-month-assignments';
import { SCHEDULE_VIEWS, useScheduleView } from '../hooks/use-schedule-view';
import { activeCountByDay } from '../lib/calendar';
import type { AllocationNotice } from '../lib/notices';
import { buildRoster } from '../lib/roster';
import { siteLabel, toSiteOptions } from '@/lib/sites';
import { workTypeSuggestions } from '../lib/work-types';
import { AllocationNoticeAlert } from './allocation-notice-alert';
import { MonthCalendar } from './month-calendar';
import { ScheduleDrawer, type SchedulePanel } from './schedule-drawer';
import { ScheduleToolbar } from './schedule-toolbar';
import { WorkerRoster } from './worker-roster';

export interface ScheduleWorkspaceProps {
  params: AllocationParams;
  reference: AllocationReference;
  daily: ApiQuery<WorkAssignmentDto[]>;
  /** Without it assignments are shown read-only. */
  canManage: boolean;
}

const ROSTER_SKELETON = (
  <div className="roster" aria-hidden>
    {['a', 'b', 'c', 'd', 'e'].map((row) => (
      <Skeleton key={row} height="2.75rem" />
    ))}
  </div>
);

export function ScheduleWorkspace({ params, reference, daily, canManage }: ScheduleWorkspaceProps) {
  const [view, setView] = useScheduleView();
  const [panel, setPanel] = useState<SchedulePanel | null>(null);
  const [notice, setNotice] = useState<AllocationNotice | null>(null);
  const { date, setDate, setSiteId } = params;
  const { sitesById, workers } = reference;

  // Finished sites stay selectable here so their past assignments can still be reviewed.
  const siteOptions = useMemo(() => toSiteOptions([...sitesById.values()]), [sitesById]);
  const siteId = sitesById.has(params.siteId) ? params.siteId : '';

  const month = useMonthAssignments(date, siteId);
  const counts = useMemo(() => month.data && activeCountByDay(month.data), [month.data]);
  const rows = useMemo(
    () => daily.data && buildRoster(workers, daily.data, siteId),
    [workers, daily.data, siteId],
  );
  const suggestions = useMemo(
    () => workTypeSuggestions(workers, daily.data ?? []),
    [workers, daily.data],
  );

  const isCalendar = view === SCHEDULE_VIEWS.CALENDAR;

  return (
    <div className="schedule">
      {notice && <AllocationNoticeAlert notice={notice} onDismiss={() => setNotice(null)} />}

      <ScheduleToolbar
        view={view}
        onViewChange={setView}
        date={date}
        onDateChange={setDate}
        siteId={siteId}
        onSiteChange={setSiteId}
        siteOptions={siteOptions}
      />

      <div className={`schedule__layout${isCalendar ? ' schedule__layout--calendar' : ''}`}>
        {isCalendar && (
          <MonthCalendar value={date} onChange={setDate} counts={counts} loading={month.loading} />
        )}

        <SectionCard
          title={`Workers · ${formatCalendarDate(date)}`}
          description={siteId ? siteLabel(sitesById.get(siteId)) : 'All sites'}
          busy={daily.loading}
          className="schedule__roster"
        >
          <QueryResult query={daily} loading={ROSTER_SKELETON}>
            {() => (
              <WorkerRoster
                rows={rows ?? []}
                siteChosen={Boolean(siteId)}
                sitesById={sitesById}
                showRate={!isCalendar}
                canManage={canManage}
                onOpenWorker={(row) => setPanel({ kind: 'worker', workerKey: row.worker.key })}
                onEdit={(row) =>
                  row.assignment && setPanel({ kind: 'edit', assignment: row.assignment })
                }
              />
            )}
          </QueryResult>
        </SectionCard>
      </div>

      <ScheduleDrawer
        panel={panel}
        onPanelChange={setPanel}
        date={date}
        rows={rows}
        reference={reference}
        workTypeSuggestions={suggestions}
        canManage={canManage}
        onNotice={setNotice}
      />
    </div>
  );
}
