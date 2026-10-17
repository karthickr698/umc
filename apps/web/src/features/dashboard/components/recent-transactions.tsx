import { ArrowLeftRight } from 'lucide-react';
import { DASHBOARD_LIMITS, type DashboardTransactionDto } from '@umc/shared';
import { EmptyState } from '@/components/feedback/empty-state';
import { SectionCard } from '@/components/layout/section-card';
import { TransactionItem } from './transaction-item';

export interface RecentTransactionsProps {
  transactions: readonly DashboardTransactionDto[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <SectionCard
      title="Recent transactions"
      description={`The latest ${DASHBOARD_LIMITS.recentTransactions} receipts, payments and expenses.`}
    >
      {transactions.length === 0 ? (
        <EmptyState
          compact
          icon={ArrowLeftRight}
          title="No transactions"
          message="Nothing has been recorded for these filters yet."
        />
      ) : (
        <ul className="transaction-list">
          {transactions.map((transaction) => (
            <TransactionItem
              key={`${transaction.kind}-${transaction.id}`}
              transaction={transaction}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
