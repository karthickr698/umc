import { z } from 'zod';
import {
  FIELD_LIMITS,
  PAYMENT_MODES,
  PAYMENT_TYPES,
  WORKER_TYPES,
  type CreatePaymentRequest,
  type PaymentMode,
} from '@umc/shared';
import { amountError, parseAmount } from '@/lib/money';
import { parseWorkerKey } from '@/lib/worker-key';
import { isCalendarDate, toCalendarDate, today } from '@/utils/calendar-date';

const amountSchema = z.string().superRefine((value, ctx) => {
  const message = amountError(value);
  if (message) ctx.addIssue({ code: 'custom', message });
});

/** Mirrors the API's create-payment rules so most mistakes are caught before a round trip. */
export const paymentEntrySchema = z.object({
  siteId: z.string().min(1, 'Choose a site'),
  workerKey: z
    .string()
    .refine((key) => parseWorkerKey(key) !== undefined, 'Choose who you are paying'),
  amount: amountSchema,
  paymentType: z.enum(PAYMENT_TYPES),
  paymentMode: z.enum(PAYMENT_MODES),
  referenceNumber: z
    .string()
    .trim()
    .max(FIELD_LIMITS.referenceNumber, `At most ${FIELD_LIMITS.referenceNumber} characters`),
  paymentDate: z.string().refine(isCalendarDate, 'Pick a valid date'),
  description: z
    .string()
    .trim()
    .max(FIELD_LIMITS.description, `At most ${FIELD_LIMITS.description} characters`),
});

export type PaymentEntryValues = z.infer<typeof paymentEntrySchema>;

export type PaymentEntryField = keyof PaymentEntryValues;

export interface PaymentEntryDefaults {
  siteId?: string;
  paymentMode?: PaymentMode;
  paymentDate?: string;
}

export function toDefaultValues({
  siteId = '',
  paymentMode = PAYMENT_MODES.CASH,
  paymentDate = toCalendarDate(today()),
}: PaymentEntryDefaults = {}): PaymentEntryValues {
  return {
    siteId,
    workerKey: '',
    amount: '',
    paymentType: PAYMENT_TYPES.WORK_PAYMENT,
    paymentMode,
    referenceNumber: '',
    paymentDate,
    description: '',
  };
}

/** Cash has no transaction reference to record. */
export function needsReference(mode: PaymentMode): boolean {
  return mode !== PAYMENT_MODES.CASH;
}

/** Expects values that already passed `paymentEntrySchema`. */
export function toCreatePaymentRequest(values: PaymentEntryValues): CreatePaymentRequest {
  const worker = parseWorkerKey(values.workerKey);
  const amount = parseAmount(values.amount);
  if (!worker || amount === undefined) throw new Error('Payment entry was not validated');

  const fields = {
    siteId: values.siteId,
    amount,
    paymentDate: values.paymentDate,
    paymentType: values.paymentType,
    paymentMode: values.paymentMode,
    ...(needsReference(values.paymentMode) &&
      values.referenceNumber && { referenceNumber: values.referenceNumber }),
    ...(values.description && { description: values.description }),
  };
  return worker.workerType === WORKER_TYPES.EMPLOYEE
    ? { ...fields, workerType: WORKER_TYPES.EMPLOYEE, employeeId: worker.id }
    : { ...fields, workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE, contractorEmployeeId: worker.id };
}
