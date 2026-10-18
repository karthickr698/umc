import { relativeDayLabel } from '@/utils/calendar-date';
import { formatLongDay } from '@/utils/format';
import { DayPicker } from './day-picker';

export interface DayStat {
  label: string;
  value: number | undefined;
  tone?: 'ok' | 'warn';
}

export interface DayBarProps {
  /** `YYYY-MM-DD`. */
  date: string;
  onDateChange: (date: string) => void;
  stats: readonly DayStat[];
}

/** The day being planned, how to change it, and a few headline numbers for it. */
export function DayBar({ date, onDateChange, stats }: DayBarProps) {
  const relative = relativeDayLabel(date);

  return (
    <section className="card day-bar" aria-label="Working day">
      <div className="day-bar__heading">
        <p className="day-bar__eyebrow">Planning work for</p>
        <h2 className="day-bar__date">
          {formatLongDay(date)}
          {relative && <span className="badge badge--warn">{relative}</span>}
        </h2>
      </div>
      <div className="day-bar__picker">
        <DayPicker label="Change day" value={date} onChange={onDateChange} />
      </div>
      <dl className="day-bar__stats">
        {stats.map((stat) => (
          <div key={stat.label} className={`day-stat${stat.tone ? ` day-stat--${stat.tone}` : ''}`}>
            <dt className="day-stat__label">{stat.label}</dt>
            <dd className="day-stat__value">{stat.value ?? '–'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
