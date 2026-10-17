import { z } from 'zod';
import {
  CODE_PATTERN,
  EMPLOYEE_LIMITS,
  FIELD_LIMITS,
  MONEY_LIMITS,
  PAGINATION,
  PASSWORD_LIMITS,
  PAYMENT_MODES,
  type Address,
} from '@umc/shared';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const idParamsSchema = z.object({ id: objectIdSchema });

/** `:workerId` may name an employee or a contractor employee. */
export const workerParamsSchema = z.object({ workerId: objectIdSchema });

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(PAGINATION.defaultPage),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.maxPageSize)
    .default(PAGINATION.defaultPageSize),
});

/** Free-text list filter; an empty value means "no filter". */
export const searchQuerySchema = z.string().trim().max(FIELD_LIMITS.search);

/**
 * A password being set. Not trimmed: whitespace can be part of a password. bcrypt ignores
 * everything past 72 bytes, so longer multi-byte passwords are rejected rather than truncated.
 */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_LIMITS.min)
  .max(PASSWORD_LIMITS.max)
  .refine(
    (password) => Buffer.byteLength(password, 'utf8') <= PASSWORD_LIMITS.maxBytes,
    `Password is too long; it must fit in ${PASSWORD_LIMITS.maxBytes} bytes`,
  );

export const nameSchema = z.string().trim().min(1, 'Name is required').max(FIELD_LIMITS.name);
export const phoneSchema = z.string().trim().max(FIELD_LIMITS.phone);
// Normalise before the format check; `z.email().trim()` would validate the untrimmed value.
export const emailSchema = z.string().trim().toLowerCase().max(FIELD_LIMITS.email).pipe(z.email());

/** An empty string clears the stored notes. */
export const notesSchema = z.string().trim().max(FIELD_LIMITS.notes);

/** Short business identifier (site code, employee code); stored upper-cased. */
export const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Code is required')
  .max(FIELD_LIMITS.code)
  .regex(CODE_PATTERN, 'Code may only contain letters, digits, "-" and "_"');

export const dailyRateSchema = z
  .number()
  .min(0)
  .max(EMPLOYEE_LIMITS.maxDailyRate)
  .multipleOf(EMPLOYEE_LIMITS.dailyRateStep, 'Daily rate may have at most two decimal places');

/** Payment and expense amounts. */
export const moneyAmountSchema = z
  .number()
  .min(MONEY_LIMITS.minAmount)
  .max(MONEY_LIMITS.maxAmount)
  .multipleOf(MONEY_LIMITS.amountStep, 'Amount may have at most two decimal places');

export const paymentModeSchema = z.enum(PAYMENT_MODES);

/** An empty string clears the stored value. */
export const referenceNumberSchema = z.string().trim().max(FIELD_LIMITS.referenceNumber);

/** An empty string clears the stored value. */
export const descriptionSchema = z.string().trim().max(FIELD_LIMITS.description);

/** Calendar day only (`2026-10-07`), no time or offset. */
export const calendarDateSchema = z.iso.date();

/** ISO-8601 calendar date (`2026-10-07`) or date-time with offset. */
export const isoDateSchema = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);

export const addressSchema = z.strictObject({
  line1: z.string().trim().max(FIELD_LIMITS.addressLine).optional(),
  line2: z.string().trim().max(FIELD_LIMITS.addressLine).optional(),
  city: z.string().trim().max(FIELD_LIMITS.city).optional(),
  state: z.string().trim().max(FIELD_LIMITS.state).optional(),
  postalCode: z.string().trim().max(FIELD_LIMITS.postalCode).optional(),
  country: z.string().trim().max(FIELD_LIMITS.country).optional(),
}) satisfies z.ZodType<Address>;

/** Rejects PATCH bodies that would change nothing. */
export function requireAnyField<T extends z.ZodObject>(schema: T): T {
  return schema.refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });
}

/**
 * Rejects `from` after `to` on queries with an inclusive calendar-day range. Refinements must be
 * added last: Zod refuses `.omit()` on a refined object.
 */
export function withDateRange<T extends z.ZodObject>(schema: T): T {
  return schema.refine(
    (query) => {
      const { from, to } = query as { from?: string; to?: string };
      return from === undefined || to === undefined || from <= to;
    },
    { message: '"from" must not be after "to"', path: ['to'] },
  );
}

export type PaginationInput = z.infer<typeof paginationQuerySchema>;
