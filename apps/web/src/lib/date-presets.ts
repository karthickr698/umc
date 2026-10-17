import { addDays, addMonths, toCalendarDate, today } from '@/utils/calendar-date';

export interface DateRange {
  /** `YYYY-MM-DD`, or empty for no limit. */
  from: string;
  to: string;
}

export interface DateRangePreset {
  id: string;
  label: string;
  range: () => DateRange;
}

export const CUSTOM_RANGE_ID = 'custom';

function rangeOf(from: Date | null, to: Date | null): DateRange {
  return { from: from ? toCalendarDate(from) : '', to: to ? toCalendarDate(to) : '' };
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

/** Quick choices for the date filter, evaluated against today each time they are picked. */
export const DATE_RANGE_PRESETS: readonly DateRangePreset[] = [
  { id: 'all', label: 'All time', range: () => rangeOf(null, null) },
  { id: 'last-7-days', label: 'Last 7 days', range: () => rangeOf(addDays(today(), -6), today()) },
  {
    id: 'last-30-days',
    label: 'Last 30 days',
    range: () => rangeOf(addDays(today(), -29), today()),
  },
  { id: 'this-month', label: 'This month', range: () => rangeOf(startOfMonth(today()), today()) },
  {
    id: 'last-month',
    label: 'Last month',
    range: () => {
      const start = addMonths(today(), -1);
      return rangeOf(start, addDays(addMonths(start, 1), -1));
    },
  },
  {
    id: 'this-year',
    label: 'This year',
    range: () => rangeOf(new Date(today().getFullYear(), 0, 1), today()),
  },
];

/** The preset producing exactly `range` today, or `CUSTOM_RANGE_ID`. */
export function matchPreset({ from, to }: DateRange): string {
  const preset = DATE_RANGE_PRESETS.find((candidate) => {
    const range = candidate.range();
    return range.from === from && range.to === to;
  });
  return preset?.id ?? CUSTOM_RANGE_ID;
}
