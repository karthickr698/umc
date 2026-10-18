import { RefreshCw } from 'lucide-react';
import { QueryResult } from '@/components/data/query-result';
import { PageContainer } from '@/components/layout/page-container';
import { useDashboardFilters } from '../hooks/use-dashboard-filters';
import { useDashboardSummary } from '../hooks/use-dashboard-summary';
import { DashboardFilterPanel } from './dashboard-filter-panel';
import { DashboardSkeleton } from './dashboard-skeleton';
import { GettingStarted } from './getting-started';
import { PaymentTrendChart } from './payment-trend-chart';
import { RecentTransactions } from './recent-transactions';
import { SiteExpenseChart } from './site-expense-chart';
import { SummaryCards } from './summary-cards';

export interface DashboardOverviewProps {
  description: string;
}

/** Money dashboard: filters, totals, trend and per-site charts, and the latest transactions. */
export function DashboardOverview({ description }: DashboardOverviewProps) {
  const { filters, query, activeCount, update, reset } = useDashboardFilters();
  const summary = useDashboardSummary(query);

  return (
    <PageContainer
      title="Dashboard"
      description={description}
      actions={
        <button
          type="button"
          className="button button--icon-on-mobile"
          onClick={summary.retry}
          disabled={summary.loading}
          title="Refresh"
        >
          <RefreshCw
            className={summary.loading ? 'spinner__icon' : undefined}
            size={16}
            aria-hidden
          />
          <span className="button__label">Refresh</span>
        </button>
      }
    >
      <div className="dashboard">
        <DashboardFilterPanel
          filters={filters}
          activeCount={activeCount}
          onChange={update}
          onReset={reset}
        />
        <GettingStarted />
        <QueryResult query={summary} loading={<DashboardSkeleton />}>
          {(data) => (
            <div className="dashboard__content" aria-busy={summary.loading}>
              <SummaryCards totals={data.totals} />
              <div className="dashboard__charts">
                {/* The echoed filters match `trend` even while newer filters are loading. */}
                <PaymentTrendChart
                  trend={data.trend}
                  range={{ from: data.filters.from ?? '', to: data.filters.to ?? '' }}
                />
                <SiteExpenseChart bySite={data.bySite} />
              </div>
              <RecentTransactions transactions={data.recentTransactions} />
            </div>
          )}
        </QueryResult>
      </div>
    </PageContainer>
  );
}
