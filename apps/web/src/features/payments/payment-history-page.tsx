import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { hasRole, ROLE_ACCESS, type Paginated, type PaymentHistoryItemDto } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { PageContainer } from '@/components/layout/page-container';
import { APP_ROUTES } from '@/config/routes';
import { useApiQuery } from '@/hooks/use-api-query';
import { useSession } from '@/features/auth';
import { PaymentHistoryFilters } from './components/payment-history-filters';
import { PaymentHistoryTable } from './components/payment-history-table';
import { usePaymentHistoryFilters } from './hooks/use-payment-history-filters';
import { PAYMENTS_API } from './payments-api';

export function PaymentHistoryPage() {
  const { user } = useSession();
  const canRecord = Boolean(user && hasRole(user.role, ROLE_ACCESS.managePayments));
  const { filters, query, activeCount, update, reset, setPage } = usePaymentHistoryFilters();
  const history = useApiQuery<Paginated<PaymentHistoryItemDto>>(PAYMENTS_API.history(query));

  return (
    <PageContainer
      title="Payment history"
      description="Wages and advances paid to workers."
      actions={
        canRecord && (
          <Link className="button button--primary" to={APP_ROUTES.paymentEntry}>
            <Plus size={16} aria-hidden />
            Record payment
          </Link>
        )
      }
    >
      <div className="stack">
        <PaymentHistoryFilters
          filters={filters}
          activeCount={activeCount}
          onChange={update}
          onReset={reset}
        />
        <QueryResult query={history}>
          {(result) => (
            <PaymentHistoryTable
              result={result}
              loading={history.loading}
              filtered={activeCount > 0}
              onPageChange={setPage}
            />
          )}
        </QueryResult>
      </div>
    </PageContainer>
  );
}
