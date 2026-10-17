import { z } from 'zod';
import type {
  ClientPaymentFilterQuery,
  CreateClientPaymentRequest,
  ListClientPaymentsQuery,
  UpdateClientPaymentRequest,
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

export const createClientPaymentSchema = z.strictObject({
  clientId: objectIdSchema,
  siteId: objectIdSchema.optional(),
  amount: moneyAmountSchema,
  receivedDate: calendarDateSchema,
  paymentMode: paymentModeSchema,
  referenceNumber: referenceNumberSchema.optional(),
  description: descriptionSchema.optional(),
}) satisfies z.ZodType<CreateClientPaymentRequest>;

export const updateClientPaymentSchema = requireAnyField(
  createClientPaymentSchema.partial().extend({
    siteId: objectIdSchema.nullable().optional(),
  }),
) satisfies z.ZodType<UpdateClientPaymentRequest>;

const filterFields = {
  clientId: objectIdSchema.optional(),
  siteId: objectIdSchema.optional(),
  paymentMode: paymentModeSchema.optional(),
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
};

export const listClientPaymentsQuerySchema = withDateRange(
  paginationQuerySchema.extend(filterFields),
) satisfies z.ZodType<ListClientPaymentsQuery>;

export const clientPaymentSummaryQuerySchema = withDateRange(
  z.object(filterFields),
) satisfies z.ZodType<ClientPaymentFilterQuery>;

export type CreateClientPaymentInput = z.infer<typeof createClientPaymentSchema>;
export type UpdateClientPaymentInput = z.infer<typeof updateClientPaymentSchema>;
export type ListClientPaymentsInput = z.infer<typeof listClientPaymentsQuerySchema>;
export type ClientPaymentSummaryInput = z.infer<typeof clientPaymentSummaryQuerySchema>;
