import { CalendarX2 } from 'lucide-react';
import type { WorkAssignmentDto } from '@umc/shared';
import { EmptyState } from '@/components/feedback/empty-state';
import type { SelectOption } from '@/components/forms/select-field';
import type { SiteGroup as SiteGroupData } from '../lib/daily-board';
import { SiteGroup } from './site-group';

export interface DailyBoardProps {
  groups: readonly SiteGroupData[];
  currentSiteId: string;
  /** Move targets; omit for a read-only board. */
  siteOptions?: readonly SelectOption[];
  pendingIds: ReadonlySet<string>;
  onMove: (assignment: WorkAssignmentDto, siteId: string) => void;
  onRemove: (assignment: WorkAssignmentDto) => void;
}

/** The day's assignments, one card per site. */
export function DailyBoard({
  groups,
  currentSiteId,
  siteOptions,
  pendingIds,
  onMove,
  onRemove,
}: DailyBoardProps) {
  if (groups.length === 0) {
    return (
      <EmptyState
        compact
        icon={CalendarX2}
        title="No assignments for this day"
        message={
          siteOptions
            ? 'Create a new assignment: select a site and workers, then press Assign. They will show up here.'
            : 'Assigned workers will show up here, grouped by site.'
        }
      />
    );
  }

  return (
    <div className="daily-board">
      {groups.map((group) => (
        <SiteGroup
          key={group.siteId}
          group={group}
          current={group.siteId === currentSiteId}
          siteOptions={siteOptions}
          pendingIds={pendingIds}
          onMove={onMove}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
