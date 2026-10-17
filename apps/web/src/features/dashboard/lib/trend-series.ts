import {
  TREND_INTERVALS,
  type DashboardTrend,
  type DashboardTrendPoint,
  type TrendInterval,
} from '@umc/shared';
import {
  addDays,
  addMonths,
  parseCalendarDate,
  toCalendarDate,
  today,
} from '@/utils/calendar-date';
import { formatCalendarDate, formatMonth, formatShortDay } from '@/utils/format';
import type { DateRange } from '@/lib/date-presets';

/** Guards the loop against unexpected input; real ranges stay far below this. */
const MAX_POINTS = 400;

const isMonthly = (interval: TrendInterval) => interval === TREND_INTERVALS.MONTH;

function toPeriod(day: string, interval: TrendInterval): string {
  return isMonthly(interval) ? day.slice(0, 7) : day;
}

function nextPeriod(period: string, interval: TrendInterval): string {
  if (isMonthly(interval)) {
    return toCalendarDate(addMonths(parseCalendarDate(`${period}-01`), 1)).slice(0, 7);
  }
  return toCalendarDate(addDays(parseCalendarDate(period), 1));
}

function emptyPoint(period: string): DashboardTrendPoint {
  return {
    period,
    clientPaymentsReceived: 0,
    workerPayments: 0,
    contractorPayments: 0,
    expenses: 0,
    balance: 0,
  };
}

const later = (a: string | undefined, b: string) => (a && a > b ? a : b);

/**
 * The API leaves out periods without records; this adds them back as zeros so the chart's time
 * axis is continuous. The axis spans the date filter, or the data where the filter is open.
 */
export function fillTrendGaps(
  { interval, points }: DashboardTrend,
  range: DateRange,
): DashboardTrendPoint[] {
  const lastPoint = points.at(-1)?.period;
  const first = range.from ? toPeriod(range.from, interval) : points[0]?.period;
  const last = range.to
    ? toPeriod(range.to, interval)
    : isMonthly(interval)
      ? lastPoint
      : later(lastPoint, toCalendarDate(today()));
  if (!first || !last) return points;

  const byPeriod = new Map(points.map((point) => [point.period, point]));
  const filled: DashboardTrendPoint[] = [];
  for (
    let period = first;
    period <= last && filled.length < MAX_POINTS;
    period = nextPeriod(period, interval)
  ) {
    filled.push(byPeriod.get(period) ?? emptyPoint(period));
  }
  return filled;
}

/** Compact axis label: `7 Oct` per day, `Oct 2026` per month. */
export function formatPeriodTick(period: string, interval: TrendInterval): string {
  return isMonthly(interval) ? formatMonth(period) : formatShortDay(period);
}

/** Full tooltip label: `7 Oct 2026` per day, `Oct 2026` per month. */
export function formatPeriod(period: string, interval: TrendInterval): string {
  return isMonthly(interval) ? formatMonth(period) : formatCalendarDate(period);
}
