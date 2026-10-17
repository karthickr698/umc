import { PAYMENT_MODES, type PaymentMode } from '@umc/shared';
import type { ChoiceOption } from '@/components/forms/choice-chips';
import { PAYMENT_MODE_LABELS } from '@/config/labels';

/** How money was paid or received; used by worker payments, expenses and client receipts. */
export const PAYMENT_MODE_OPTIONS: readonly ChoiceOption<PaymentMode>[] = Object.values(
  PAYMENT_MODES,
).map((value) => ({ value, label: PAYMENT_MODE_LABELS[value] }));

export function isPaymentMode(value: unknown): value is PaymentMode {
  return typeof value === 'string' && Object.values<string>(PAYMENT_MODES).includes(value);
}
