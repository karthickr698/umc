import { isActiveWorkAssignmentStatus, type WorkAssignmentDto } from '@umc/shared';
import { addDays, addMonths, parseCalendarDate, toCalendarDate } from '@/utils/calendar-date';

/** Weeks start on Monday. */
const WEEK_START = 1;
const DAYS_PER_WEEK = 7;

export interface CalendarCell {
  /** `YYYY-MM-DD`. */
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  weekend: boolean;
}

// A type alias rather than an interface so it can be passed as query params.
export type MonthRange = {
  from: string;
  to: string;
};

/** First and last day of the month containing `day`. */
export function monthRange(day: string): MonthRange {
  const first = addMonths(parseCalendarDate(day), 0);
  return { from: toCalendarDate(first), to: toCalendarDate(addDays(addMonths(first, 1), -1)) };
}

/** First day of the month `months` away from the one containing `day`. */
export function shiftMonth(day: string, months: number): string {
  return toCalendarDate(addMonths(parseCalendarDate(day), months));
}

/** Whole weeks covering the month containing `day`, padded with days of the adjacent months. */
export function monthGrid(day: string): CalendarCell[][] {
  const { from, to } = monthRange(day);
  const first = parseCalendarDate(from);
  const last = parseCalendarDate(to);
  const lead = (first.getDay() - WEEK_START + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const trail = (WEEK_START + DAYS_PER_WEEK - 1 - last.getDay()) % DAYS_PER_WEEK;
  const start = addDays(first, -lead);
  const total = lead + last.getDate() + trail;

  const weeks: CalendarCell[][] = [];
  for (let offset = 0; offset < total; offset += 1) {
    const date = addDays(start, offset);
    if (offset % DAYS_PER_WEEK === 0) weeks.push([]);
    weeks.at(-1)?.push({
      date: toCalendarDate(date),
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === first.getMonth(),
      weekend: date.getDay() === 0 || date.getDay() === 6,
    });
  }
  return weeks;
}

const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

/** Short weekday names in grid order, e.g. `Mon … Sun`. */
export function weekdayLabels(): string[] {
  // 2024-01-01 was a Monday.
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: DAYS_PER_WEEK }, (_, index) =>
    weekdayFormat.format(addDays(monday, (index + WEEK_START - 1) % DAYS_PER_WEEK)),
  );
}

/** Assignments that occupy a worker's day, counted per `YYYY-MM-DD`. */
export function activeCountByDay(
  assignments: readonly WorkAssignmentDto[],
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const assignment of assignments) {
    if (!isActiveWorkAssignmentStatus(assignment.status)) continue;
    counts.set(assignment.date, (counts.get(assignment.date) ?? 0) + 1);
  }
  return counts;
}
