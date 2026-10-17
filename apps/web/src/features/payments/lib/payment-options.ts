import { PAYMENT_TYPES, type PaymentType } from '@umc/shared';
import type { ChoiceOption } from '@/components/forms/choice-chips';
import { PAYMENT_TYPE_LABELS } from '@/config/labels';

export const PAYMENT_TYPE_OPTIONS: readonly ChoiceOption<PaymentType>[] = Object.values(
  PAYMENT_TYPES,
).map((value) => ({ value, label: PAYMENT_TYPE_LABELS[value] }));

export function isPaymentType(value: unknown): value is PaymentType {
  return typeof value === 'string' && Object.values<string>(PAYMENT_TYPES).includes(value);
}
