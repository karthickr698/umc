import { z } from 'zod';
import {
  PAYMENT_TYPES,
  WORKER_TYPES,
  type CreatePaymentRequest,
  type UpdatePaymentRequest,
} from '@umc/shared';
import {
  calendarDateSchema,
  descriptionSchema,
  moneyAmountSchema,
  objectIdSchema,
  paginationQuerySchema,
  paymentModeSchema,
  referenceNumberSchema,
  requireAnyField,
  withDateRange,
} from './common.validator.js';

const paymentTypeSchema = z.enum(PAYMENT_TYPES);

const paymentFields = {
  siteId: objectIdSchema.optional(),
  amount: moneyAmountSchema,
  paymentDate: calendarDateSchema,
  paymentType: paymentTypeSchema,
  paymentMode: paymentModeSchema,
  referenceNumber: referenceNumberSchema.optional(),
  description: descriptionSchema.optional(),
};

export const createPaymentSchema = z.discriminatedUnion('workerType', [
  z.strictObject({
    ...paymentFields,
    workerType: z.literal(WORKER_TYPES.EMPLOYEE),
    employeeId: objectIdSchema,
  }),
  z.strictObject({
    ...paymentFields,
    workerType: z.literal(WORKER_TYPES.CONTRACTOR_EMPLOYEE),
    contractorEmployeeId: objectIdSchema,
    contractorId: objectIdSchema.optional(),
  }),
]) satisfies z.ZodType<CreatePaymentRequest>;

export const updatePaymentSchema = requireAnyField(
  z.strictObject({
    siteId: objectIdSchema.nullable().optional(),
    employeeId: objectIdSchema.optional(),
    contractorEmployeeId: objectIdSchema.optional(),
    amount: moneyAmountSchema.optional(),
    paymentDate: calendarDateSchema.optional(),
    paymentType: paymentTypeSchema.optional(),
    paymentMode: paymentModeSchema.optional(),
    referenceNumber: referenceNumberSchema.optional(),
    description: descriptionSchema.optional(),
  }),
).refine((input) => input.employeeId === undefined || input.contractorEmployeeId === undefined, {
  message: 'Send either employeeId or contractorEmployeeId, not both',
  path: ['contractorEmployeeId'],
}) satisfies z.ZodType<UpdatePaymentRequest>;

export const listPaymentsQuerySchema = withDateRange(
  paginationQuerySchema.extend({
    siteId: objectIdSchema.optional(),
    workerType: z.enum(WORKER_TYPES).optional(),
    employeeId: objectIdSchema.optional(),
    contractorId: objectIdSchema.optional(),
    contractorEmployeeId: objectIdSchema.optional(),
    paymentType: paymentTypeSchema.optional(),
    paymentMode: paymentModeSchema.optional(),
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  }),
);

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ListPaymentsInput = z.infer<typeof listPaymentsQuerySchema>;

/** Payment history accepts exactly the payment list's filters. */
export const paymentHistoryQuerySchema = listPaymentsQuerySchema;
export type PaymentHistoryInput = ListPaymentsInput;
