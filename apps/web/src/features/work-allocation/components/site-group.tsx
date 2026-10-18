import { MapPin } from 'lucide-react';
import type { WorkAssignmentDto } from '@umc/shared';
import type { SelectOption } from '@/components/forms/select-field';
import type { SiteGroup as SiteGroupData } from '../lib/daily-board';
import { workerCount } from '../lib/notices';
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
  const name = group.site?.name ?? 'Unknown site';

  return (
    <section className={`site-group${current ? ' site-group--current' : ''}`}>
      <header className="site-group__header">
        <span className="site-group__icon" aria-hidden>
          <MapPin size={16} />
        </span>
        <div className="site-group__heading">
          <h3 className="site-group__title">{name}</h3>
          <p className="site-group__meta">
            {group.site && `${group.site.code} · `}
            {workerCount(group.activeCount)}
            {current && <span className="badge badge--warn">Selected</span>}
          </p>
        </div>
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
