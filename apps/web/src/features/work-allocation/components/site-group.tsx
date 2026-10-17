import type { WorkAssignmentDto } from '@umc/shared';
import type { SelectOption } from '@/components/forms/select-field';
import type { SiteGroup as SiteGroupData } from '../lib/daily-board';
import { AssignmentRow } from './assignment-row';

export interface SiteGroupProps {
  group: SiteGroupData;
  /** The site chosen in the assign panel. */
  current: boolean;
  /** Every assignable site; omit for a read-only group. */
  siteOptions?: readonly SelectOption[];
  pendingIds: ReadonlySet<string>;
  onMove: (assignment: WorkAssignmentDto, siteId: string) => void;
  onRemove: (assignment: WorkAssignmentDto) => void;
}

export function SiteGroup({
  group,
  current,
  siteOptions,
  pendingIds,
  onMove,
  onRemove,
}: SiteGroupProps) {
  const moveTargets = siteOptions?.filter((option) => option.value !== group.siteId);

  return (
    <section className={`site-group${current ? ' site-group--current' : ''}`}>
      <header className="site-group__header">
        <h3 className="site-group__title">
          {group.site?.name ?? 'Unknown site'}
          {group.site && <span className="site-group__code">{group.site.code}</span>}
        </h3>
        <span className="count-badge" aria-label={`${group.activeCount} assigned`}>
          {group.activeCount}
        </span>
      </header>
      <ul className="site-group__list">
        {group.assignments.map((item) => (
          <AssignmentRow
            key={item.assignment.id}
            item={item}
            moveTargets={moveTargets}
            pending={pendingIds.has(item.assignment.id)}
            onMove={onMove}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  );
}
