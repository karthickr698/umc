import { z } from 'zod';
import {
  EXPENSE_CATEGORIES,
  FIELD_LIMITS,
  type CreateExpenseRequest,
  type UpdateExpenseRequest,
} from '@umc/shared';
import {
  calendarDateSchema,
  descriptionSchema,
  moneyAmountSchema,
  objectIdSchema,
  paginationQuerySchema,
  paymentModeSchema,
  requireAnyField,
  withDateRange,
} from './common.validator.js';

const categorySchema = z.enum(EXPENSE_CATEGORIES);

/** An empty string clears the stored value. */
const vendorNameSchema = z.string().trim().max(FIELD_LIMITS.vendorName);

export const createExpenseSchema = z.strictObject({
  siteId: objectIdSchema,
  category: categorySchema,
  vendorName: vendorNameSchema.optional(),
  amount: moneyAmountSchema,
  expenseDate: calendarDateSchema,
  paymentMode: paymentModeSchema,
  description: descriptionSchema.optional(),
}) satisfies z.ZodType<CreateExpenseRequest>;

export const updateExpenseSchema = requireAnyField(
  createExpenseSchema.partial(),
) satisfies z.ZodType<UpdateExpenseRequest>;

export const listExpensesQuerySchema = withDateRange(
  paginationQuerySchema.extend({
    siteId: objectIdSchema.optional(),
    category: categorySchema.optional(),
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  }),
);

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesInput = z.infer<typeof listExpensesQuerySchema>;
