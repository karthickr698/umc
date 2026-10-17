import { fromCalendarDate } from '../../utils/calendar-date.js';

// Payments in this app are Indian (UPI, cheque); amounts carry no currency code, matching the web.
const LOCALE = 'en-IN';

const amountFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
// Calendar days are stored at UTC midnight, so format them in UTC to avoid shifting the day.
const calendarDateFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeZone: 'UTC',
});
// `timeZoneName` cannot be combined with `dateStyle`, so the zone is appended by hand.
const timestampFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export function formatAmount(amount: number): string {
  return amountFormat.format(amount);
}

/** `YYYY-MM-DD` → `7 Oct 2026`. */
export function formatCalendarDate(day: string): string {
  return calendarDateFormat.format(fromCalendarDate(day));
}

export function formatTimestamp(date: Date): string {
  return `${timestampFormat.format(date)} UTC`;
}
