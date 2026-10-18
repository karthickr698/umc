import type { Address } from '@umc/shared';
import { parseCalendarDate } from './calendar-date';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const longDayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const shortDayFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' });
const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });
// Amounts carry no currency code, so they are shown as plain two-decimal numbers.
const amountFormat = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const compactAmountFormat = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** ISO-8601 date or timestamp → `7 Oct 2026` in the user's locale. */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** Calendar day `YYYY-MM-DD` → `7 Oct 2026`, without shifting it across time zones. */
export function formatCalendarDate(day: string): string {
  return dateFormat.format(parseCalendarDate(day));
}

/** Calendar day `YYYY-MM-DD` → `Wed, 7 Oct 2026`. */
export function formatLongDay(day: string): string {
  return longDayFormat.format(parseCalendarDate(day));
}

/** Calendar day `YYYY-MM-DD` → `7 Oct`. */
export function formatShortDay(day: string): string {
  return shortDayFormat.format(parseCalendarDate(day));
}

/** Month `YYYY-MM` → `Oct 2026`. */
export function formatMonth(month: string): string {
  return monthFormat.format(parseCalendarDate(`${month}-01`));
}

export function formatAmount(amount: number): string {
  return amountFormat.format(amount);
}

/** `1250000` → `1.3M`; for chart axes where space is tight. */
export function formatCompactAmount(amount: number): string {
  return compactAmountFormat.format(amount);
}

export { formatAddress } from '@umc/shared';

/** `City, State Postal code`, or an empty string when none of them is set. */
export function addressLocality(address: Address | undefined): string {
  if (!address) return '';
  const { city, state, postalCode } = address;
  return [city, [state, postalCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

/** An address as postal lines: street lines, then "City, State Postal code", then country. */
export function addressLines(address: Address | undefined): string[] {
  if (!address) return [];
  const { line1, line2, country } = address;
  return [line1, line2, addressLocality(address), country].filter((line): line is string =>
    Boolean(line),
  );
}

/** `Asha Builders` → `AB`; for avatars. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/** Shortens `text` to at most `max` characters, ending in an ellipsis when cut. */
export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** `CONTRACTOR_EMPLOYEE` → `Contractor employee`. */
export function humanizeEnum(value: string): string {
  const sentence = value.toLowerCase().replaceAll('_', ' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** Up to two initials, e.g. `Ravi Kumar Sharma` → `RS`. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase() || '?';
}
