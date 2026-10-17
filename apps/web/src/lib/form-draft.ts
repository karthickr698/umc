import { CODE_PATTERN, EMPLOYEE_LIMITS, FIELD_LIMITS } from '@umc/shared';

/** Form values as typed; numbers and enums stay strings until the request is built. */
export type Draft = Record<string, string>;

export type DraftErrors<D extends Draft> = Partial<Record<keyof D & string, string>>;

export function hasErrors(errors: Readonly<Record<string, string | undefined>>): boolean {
  return Object.values(errors).some(Boolean);
}

interface TextRules {
  /** Shown as "<label> is required". */
  label: string;
  max: number;
  required?: boolean;
}

export function textError(value: string, { label, max, required = false }: TextRules) {
  const text = value.trim();
  if (required && !text) return `${label} is required`;
  if (text.length > max) return `Use at most ${max} characters`;
  return undefined;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The API can replace a stored email but not clear it, so `previous` makes an emptied field an
 * error instead of a change that is silently dropped.
 */
export function emailError(value: string, previous?: string) {
  const email = value.trim();
  if (!email) return previous ? 'Enter a new email; it cannot be removed' : undefined;
  if (email.length > FIELD_LIMITS.email) return `Use at most ${FIELD_LIMITS.email} characters`;
  return EMAIL_PATTERN.test(email) ? undefined : 'Enter a valid email address';
}

export function codeError(value: string) {
  const code = value.trim().toUpperCase();
  if (!code) return 'Code is required';
  if (code.length > FIELD_LIMITS.code) return `Use at most ${FIELD_LIMITS.code} characters`;
  return CODE_PATTERN.test(code) ? undefined : 'Use only letters, digits, "-" and "_"';
}

const RATE_PATTERN = /^\d+(\.\d{1,2})?$/;

export function dailyRateError(value: string) {
  const rate = value.trim();
  if (!rate) return 'Enter the daily wage';
  if (!RATE_PATTERN.test(rate)) return 'Enter an amount with at most two decimal places';
  if (Number(rate) > EMPLOYEE_LIMITS.maxDailyRate) {
    return `Enter at most ${EMPLOYEE_LIMITS.maxDailyRate}`;
  }
  return undefined;
}

/** `value` when it is one of `values` (an `*_STATUSES`-style map), otherwise `fallback`. */
export function toEnum<T extends string>(
  values: Readonly<Record<string, T>>,
  value: string,
  fallback: T,
): T {
  return Object.values(values).find((candidate) => candidate === value) ?? fallback;
}

/** `request` without empty strings or empty nested objects; for create requests. */
export function withoutEmpty<T extends object>(request: T): Partial<T> {
  const entries = Object.entries(request).flatMap(([key, value]): [string, unknown][] => {
    if (value === '' || value === undefined) return [];
    if (typeof value === 'object' && value !== null) {
      const nested = withoutEmpty(value);
      return Object.keys(nested).length > 0 ? [[key, nested]] : [];
    }
    return [[key, value]];
  });
  return Object.fromEntries(entries) as Partial<T>;
}

/** The fields of `after` whose value differs from `before`; for update requests. */
export function changedFields<T extends object>(before: T, after: T): Partial<T> {
  const beforeValues = new Map<string, unknown>(Object.entries(before));
  const entries = Object.entries(after).filter(
    ([key, value]) => JSON.stringify(value) !== JSON.stringify(beforeValues.get(key)),
  );
  return Object.fromEntries(entries) as Partial<T>;
}
