import type { DashboardTransactionDto } from '@umc/shared';
import { formatAmount, formatCalendarDate } from '@/utils/format';
import { describeTransaction, TRANSACTION_KIND_DISPLAY } from '../lib/transaction-display';

export interface TransactionItemProps {
  transaction: DashboardTransactionDto;
}

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { label, icon: Icon, color, incoming } = TRANSACTION_KIND_DISPLAY[transaction.kind];
  const details = describeTransaction(transaction);
  const meta = [transaction.counterparty ? label : undefined, details].filter(Boolean).join(' · ');

  return (
    <li className="transaction">
      <span className="transaction__icon" style={{ color }} aria-hidden>
        <Icon size={18} />
      </span>
      <div className="transaction__main">
        <p className="transaction__title">{transaction.counterparty ?? label}</p>
        {meta && <p className="transaction__meta">{meta}</p>}
      </div>
      <div className="transaction__side">
        <p className={`transaction__amount transaction__amount--${incoming ? 'in' : 'out'}`}>
          <span className="visually-hidden">{incoming ? 'Received ' : 'Paid '}</span>
          <span aria-hidden>{incoming ? '+' : '−'}</span>
          {formatAmount(transaction.amount)}
        </p>
        <time className="transaction__date" dateTime={transaction.date}>
          {formatCalendarDate(transaction.date)}
        </time>
      </div>
    </li>
  );
}
