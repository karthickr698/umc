import {
  FIELD_LIMITS,
  PAYMENT_MODES,
  type ClientPaymentDto,
  type CreateClientPaymentRequest,
  type UpdateClientPaymentRequest,
} from '@umc/shared';
import { changedFields, textError, toEnum, withoutEmpty, type DraftErrors } from '@/lib/form-draft';
import { amountError, parseAmount } from '@/lib/money';
import { isCalendarDate, toCalendarDate, today } from '@/utils/calendar-date';

export type ClientPaymentDraft = {
  clientId: string;
  /** Empty when the money is not for a specific site. */
  siteId: string;
  amount: string;
  receivedDate: string;
  paymentMode: string;
  referenceNumber: string;
  description: string;
};

/** New receipts default to today, received in cash. */
export function toClientPaymentDraft(payment?: ClientPaymentDto): ClientPaymentDraft {
  return {
    clientId: payment?.clientId ?? '',
    siteId: payment?.siteId ?? '',
    amount: payment ? payment.amount.toFixed(2) : '',
    receivedDate: payment?.receivedDate ?? toCalendarDate(today()),
    paymentMode: payment?.paymentMode ?? PAYMENT_MODES.CASH,
    referenceNumber: payment?.referenceNumber ?? '',
    description: payment?.description ?? '',
  };
}

export function validateClientPaymentDraft(draft: ClientPaymentDraft) {
  const errors: DraftErrors<ClientPaymentDraft> = {
    clientId: draft.clientId ? undefined : 'Choose who paid you',
    amount: amountError(draft.amount),
    receivedDate: isCalendarDate(draft.receivedDate) ? undefined : 'Pick the date',
    referenceNumber: textError(draft.referenceNumber, {
      label: 'Reference',
      max: FIELD_LIMITS.referenceNumber,
    }),
    description: textError(draft.description, {
      label: 'Note',
      max: FIELD_LIMITS.description,
    }),
  };
  return errors;
}

/** Every field as the update endpoint takes it; `siteId: null` detaches the receipt. */
function toRequest(draft: ClientPaymentDraft) {
  return {
    clientId: draft.clientId,
    siteId: draft.siteId || null,
    amount: parseAmount(draft.amount) ?? 0,
    receivedDate: draft.receivedDate,
    paymentMode: toEnum(PAYMENT_MODES, draft.paymentMode, PAYMENT_MODES.CASH),
    referenceNumber: draft.referenceNumber.trim(),
    description: draft.description.trim(),
  } satisfies UpdateClientPaymentRequest;
}

export function toCreateClientPaymentRequest(
  draft: ClientPaymentDraft,
): CreateClientPaymentRequest {
  const { siteId, referenceNumber, description, ...required } = toRequest(draft);
  return {
    ...required,
    ...(siteId && { siteId }),
    ...withoutEmpty({ referenceNumber, description }),
  };
}

export function toClientPaymentChanges(
  payment: ClientPaymentDto,
  draft: ClientPaymentDraft,
): UpdateClientPaymentRequest {
  return changedFields(toRequest(toClientPaymentDraft(payment)), toRequest(draft));
}
