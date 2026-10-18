const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Whether `value` is a real `YYYY-MM-DD` day. */
export function isCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE_PATTERN.test(value)) return false;
  return toCalendarDate(parseCalendarDate(value)) === value;
}

/** `YYYY-MM-DD` → local midnight of that day (`new Date(day)` would use UTC midnight). */
export function parseCalendarDate(day: string): Date {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

/** Local day of `date` → `YYYY-MM-DD`. */
export function toCalendarDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

const RELATIVE_DAYS: Readonly<Record<number, string>> = {
  [-1]: 'Yesterday',
  0: 'Today',
  1: 'Tomorrow',
};

/** "Yesterday", "Today" or "Tomorrow" for a `YYYY-MM-DD` day close to today; else `undefined`. */
export function relativeDayLabel(day: string): string | undefined {
  for (const [offset, label] of Object.entries(RELATIVE_DAYS)) {
    if (toCalendarDate(addDays(today(), Number(offset))) === day) return label;
  }
  return undefined;
}
