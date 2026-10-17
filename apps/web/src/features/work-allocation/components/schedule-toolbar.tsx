import { CalendarDays, List } from 'lucide-react';
import { SelectField, type SelectOption } from '@/components/forms/select-field';
import { SCHEDULE_VIEWS, type ScheduleView } from '../hooks/use-schedule-view';
import { DayPicker } from './day-picker';

export interface ScheduleToolbarProps {
  view: ScheduleView;
  onViewChange: (view: ScheduleView) => void;
  date: string;
  onDateChange: (date: string) => void;
  siteId: string;
  onSiteChange: (siteId: string) => void;
  siteOptions: readonly SelectOption[];
}

const VIEW_OPTIONS = [
  { value: SCHEDULE_VIEWS.CALENDAR, label: 'Calendar', icon: CalendarDays },
  { value: SCHEDULE_VIEWS.LIST, label: 'List', icon: List },
] as const;

/** Site filter, view switch and, in list view where there is no calendar, the day picker. */
export function ScheduleToolbar({
  view,
  onViewChange,
  date,
  onDateChange,
  siteId,
  onSiteChange,
  siteOptions,
}: ScheduleToolbarProps) {
  return (
    <div className="card schedule-toolbar">
      <div className="schedule-toolbar__fields">
        <SelectField
          label="Site"
          placeholder="All sites"
          value={siteId}
          options={siteOptions}
          onChange={onSiteChange}
        />
        {view === SCHEDULE_VIEWS.LIST && <DayPicker value={date} onChange={onDateChange} />}
      </div>
      <div className="segmented schedule-toolbar__views" role="group" aria-label="Layout">
        {VIEW_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            className="segmented__option"
            aria-pressed={view === value}
            onClick={() => onViewChange(value)}
          >
            <Icon size={14} aria-hidden />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
