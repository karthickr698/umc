import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionCard } from '@/components/layout/section-card';
import { toCalendarDate, today } from '@/utils/calendar-date';
import { formatCalendarDate, formatMonth } from '@/utils/format';
import { monthGrid, shiftMonth, weekdayLabels } from '../lib/calendar';

export interface MonthCalendarProps {
  /** The chosen day, `YYYY-MM-DD`; its month is shown. */
  value: string;
  onChange: (day: string) => void;
  /** Workers assigned per day; `undefined` while the month loads. */
  counts: ReadonlyMap<string, number> | undefined;
  loading: boolean;
}

const WEEKDAYS = weekdayLabels();

/** Month grid showing how many workers are assigned each day; picking a day selects it. */
export function MonthCalendar({ value, onChange, counts, loading }: MonthCalendarProps) {
  const todayValue = toCalendarDate(today());
  const weeks = monthGrid(value);

  return (
    <SectionCard
      title={formatMonth(value.slice(0, 7))}
      description="Workers assigned per day"
      busy={loading}
      className="month-calendar"
      actions={
        <div className="month-calendar__nav">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous month"
            onClick={() => onChange(shiftMonth(value, -1))}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="button button--small button--ghost"
            disabled={value === todayValue}
            onClick={() => onChange(todayValue)}
          >
            Today
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Next month"
            onClick={() => onChange(shiftMonth(value, 1))}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      }
    >
      <table className="month-calendar__grid">
        <thead>
          <tr>
            {WEEKDAYS.map((weekday) => (
              <th key={weekday} scope="col">
                {weekday}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]?.date}>
              {week.map((cell) => {
                const count = counts?.get(cell.date) ?? 0;
                const classes = [
                  'month-calendar__day',
                  !cell.inMonth && 'month-calendar__day--outside',
                  cell.weekend && 'month-calendar__day--weekend',
                  cell.date === todayValue && 'month-calendar__day--today',
                ]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <td key={cell.date}>
                    <button
                      type="button"
                      className={classes}
                      aria-pressed={cell.date === value}
                      aria-current={cell.date === todayValue ? 'date' : undefined}
                      aria-label={`${formatCalendarDate(cell.date)}, ${count} assigned`}
                      onClick={() => onChange(cell.date)}
                    >
                      <span className="month-calendar__number">{cell.dayOfMonth}</span>
                      {counts && (
                        <span
                          className={`month-calendar__count${count === 0 ? ' month-calendar__count--empty' : ''}`}
                          aria-hidden
                        >
                          {count === 0 ? '–' : count}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
