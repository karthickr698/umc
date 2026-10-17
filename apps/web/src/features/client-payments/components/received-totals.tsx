import { HandCoins, Receipt } from 'lucide-react';
import {
  API_ROUTES,
  type ClientPaymentFilterQuery,
  type ClientPaymentSummaryDto,
} from '@umc/shared';
import { StatCard } from '@/components/data/stat-card';
import { useApiQuery } from '@/hooks/use-api-query';
import { formatAmount } from '@/utils/format';
import { withQuery } from '@/utils/query-string';

const { base, summary } = API_ROUTES.clientPayments;

/** Total received over every receipt matching `filters`, not just the visible page. */
export function ReceivedTotals({ filters }: { filters: ClientPaymentFilterQuery }) {
  const { data } = useApiQuery<ClientPaymentSummaryDto>(
    withQuery(`${base}${summary}`, { ...filters }),
  );
  const totals = data?.totals;

  return (
    <div className="summary-cards summary-cards--pair">
      <StatCard
        label="Total received"
        icon={HandCoins}
        tone="positive"
        loading={!totals}
        value={formatAmount(totals?.totalAmount ?? 0)}
        hint="For the filters you chose"
      />
      <StatCard
        label="Payments"
        icon={Receipt}
        tone="neutral"
        loading={!totals}
        value={totals?.paymentCount ?? 0}
        hint="Number of times money came in"
      />
    </div>
  );
}
