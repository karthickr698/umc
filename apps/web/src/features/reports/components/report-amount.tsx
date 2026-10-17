import { formatAmount } from '@/utils/format';

/** A formatted amount, highlighted when negative. */
export function ReportAmount({ value }: { value: number }) {
  return <span className={value < 0 ? 'amount--negative' : undefined}>{formatAmount(value)}</span>;
}
