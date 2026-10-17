import { ERROR_CODES } from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { describeError } from '@/utils/describe-error';
import { isValidationIssue } from '@/utils/validation-issues';
import type { PaymentEntryField } from './payment-entry-schema';

/** API request fields → the form field that edits them. */
const FIELD_BY_PATH: Readonly<Record<string, PaymentEntryField>> = {
  siteId: 'siteId',
  employeeId: 'workerKey',
  contractorEmployeeId: 'workerKey',
  contractorId: 'workerKey',
  amount: 'amount',
  paymentType: 'paymentType',
  paymentMode: 'paymentMode',
  referenceNumber: 'referenceNumber',
  paymentDate: 'paymentDate',
  description: 'description',
};

export interface PaymentEntryFailure {
  message: string;
  fieldErrors: Partial<Record<PaymentEntryField, string>>;
}

export function describePaymentEntryError(error: unknown): PaymentEntryFailure {
  if (error instanceof ApiClientError && error.code === ERROR_CODES.VALIDATION_ERROR) {
    const fieldErrors: Partial<Record<PaymentEntryField, string>> = {};
    if (Array.isArray(error.details)) {
      for (const issue of error.details) {
        if (!isValidationIssue(issue)) continue;
        const field = FIELD_BY_PATH[issue.path];
        if (field) fieldErrors[field] ??= issue.message;
      }
    }
    return { message: 'Please correct the highlighted fields.', fieldErrors };
  }
  return { message: describeError(error).message, fieldErrors: {} };
}
