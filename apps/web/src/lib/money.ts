import { MONEY_LIMITS } from '@umc/shared';
import { formatAmount } from '@/utils/format';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/** Typed amount → number; thousands separators are allowed, anything else is `undefined`. */
export function parseAmount(value: string): number | undefined {
  const normalized = value.trim().replaceAll(',', '');
  return AMOUNT_PATTERN.test(normalized) ? Number(normalized) : undefined;
}

/** Why a typed payment or expense amount would be rejected by the API, if it would. */
export function amountError(value: string): string | undefined {
  if (!value.trim()) return 'Enter the amount';
  const amount = parseAmount(value);
  if (amount === undefined) return 'Use digits only, with at most 2 decimals';
  if (amount < MONEY_LIMITS.minAmount) return 'Amount must be more than zero';
  if (amount > MONEY_LIMITS.maxAmount) {
    return `Amount cannot exceed ${formatAmount(MONEY_LIMITS.maxAmount)}`;
  }
  return undefined;
}
