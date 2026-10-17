import { HandCoins, HardHat, type LucideIcon, Receipt, Users } from 'lucide-react';
import { TRANSACTION_KINDS, type DashboardTransactionDto, type TransactionKind } from '@umc/shared';
import { PAYMENT_MODE_LABELS } from '@/config/labels';
import { humanizeEnum } from '@/utils/format';
import { MONEY_SERIES } from './money-series';

export interface TransactionKindDisplay {
  label: string;
  icon: LucideIcon;
  color: string;
  /** Money received adds to the balance; everything else is paid out. */
  incoming: boolean;
}

export const TRANSACTION_KIND_DISPLAY: Readonly<Record<TransactionKind, TransactionKindDisplay>> = {
  [TRANSACTION_KINDS.CLIENT_PAYMENT]: {
    label: 'Client payment',
    icon: HandCoins,
    color: MONEY_SERIES.clientPaymentsReceived.color,
    incoming: true,
  },
  [TRANSACTION_KINDS.WORKER_PAYMENT]: {
    label: 'Worker payment',
    icon: Users,
    color: MONEY_SERIES.workerPayments.color,
    incoming: false,
  },
  [TRANSACTION_KINDS.CONTRACTOR_PAYMENT]: {
    label: 'Contractor payment',
    icon: HardHat,
    color: MONEY_SERIES.contractorPayments.color,
    incoming: false,
  },
  [TRANSACTION_KINDS.EXPENSE]: {
    label: 'Expense',
    icon: Receipt,
    color: MONEY_SERIES.expenses.color,
    incoming: false,
  },
};

/** Secondary facts of a transaction, e.g. `Advance · Riverside Villas · UPI`. */
export function describeTransaction(transaction: DashboardTransactionDto): string {
  const kind = transaction.paymentType ?? transaction.expenseCategory;
  return [
    kind ? humanizeEnum(kind) : undefined,
    transaction.siteName,
    PAYMENT_MODE_LABELS[transaction.paymentMode],
  ]
    .filter(Boolean)
    .join(' · ');
}
