import { z } from 'zod';
import {
  INVOICE_LIMITS,
  INVOICE_RECIPIENT_TYPES,
  INVOICE_STATUSES,
  type CreateInvoiceRequest,
  type RegenerateInvoiceRequest,
  type SendInvoiceWhatsappRequest,
} from '@umc/shared';
import { calendarDaySpan, fromCalendarDate } from '../utils/calendar-date.js';
import {
  calendarDateSchema,
  descriptionSchema,
  notesSchema,
  objectIdSchema,
  paginationQuerySchema,
  phoneSchema,
  searchQuerySchema,
  withDateRange,
} from './common.validator.js';

const workPeriodSchema = z
  .strictObject({ from: calendarDateSchema, to: calendarDateSchema })
  .refine(({ from, to }) => from <= to, { message: '"from" must not be after "to"', path: ['to'] })
  .refine(
    ({ from, to }) =>
      calendarDaySpan(fromCalendarDate(from), fromCalendarDate(to)) <=
      INVOICE_LIMITS.maxWorkPeriodDays,
    {
      message: `Work period may span at most ${INVOICE_LIMITS.maxWorkPeriodDays} days`,
      path: ['to'],
    },
  );

export const createInvoiceSchema = z.strictObject({
  paymentId: objectIdSchema,
  invoiceDate: calendarDateSchema.optional(),
  workPeriod: workPeriodSchema.optional(),
  workDetails: descriptionSchema.optional(),
  notes: notesSchema.optional(),
  sendWhatsapp: z.boolean().optional(),
}) satisfies z.ZodType<CreateInvoiceRequest>;

/** The number's format is checked when sending, against WhatsApp's rules. */
export const sendInvoiceWhatsappSchema = z.strictObject({
  phone: phoneSchema.min(1, 'Phone is required').optional(),
}) satisfies z.ZodType<SendInvoiceWhatsappRequest>;

/** Every field is optional: an empty body re-renders from the payment's current data. */
export const regenerateInvoiceSchema = z.strictObject({
  invoiceDate: calendarDateSchema.optional(),
  workPeriod: workPeriodSchema.nullable().optional(),
  workDetails: descriptionSchema.optional(),
  notes: notesSchema.optional(),
}) satisfies z.ZodType<RegenerateInvoiceRequest>;

export const listInvoicesQuerySchema = withDateRange(
  paginationQuerySchema.extend({
    paymentId: objectIdSchema.optional(),
    siteId: objectIdSchema.optional(),
    status: z.enum(INVOICE_STATUSES).optional(),
    recipientType: z.enum(INVOICE_RECIPIENT_TYPES).optional(),
    search: searchQuerySchema.optional(),
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  }),
);

export type WorkPeriodInput = z.infer<typeof workPeriodSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RegenerateInvoiceInput = z.infer<typeof regenerateInvoiceSchema>;
export type SendInvoiceWhatsappInput = z.infer<typeof sendInvoiceWhatsappSchema>;
export type ListInvoicesInput = z.infer<typeof listInvoicesQuerySchema>;
