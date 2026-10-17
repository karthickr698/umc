const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Mongoose validator for fields that store a calendar day at UTC midnight. */
export const calendarDayValidator = {
  validator: (value: Date): boolean => value.getTime() % MS_PER_DAY === 0,
  message: '{PATH} must be a calendar day at UTC midnight',
};

/** `YYYY-MM-DD` → that day at UTC midnight, which is how calendar days are stored. */
export function fromCalendarDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Number of calendar days from `from` to `to`, both included. */
export function calendarDaySpan(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;
}

/** A stored calendar day (UTC midnight) → `YYYY-MM-DD`. */
export function toCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
