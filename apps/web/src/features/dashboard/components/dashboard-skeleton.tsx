import { Skeleton } from '@/components/feedback/skeleton';
import { SummaryCards } from './summary-cards';

const PLACEHOLDER_ROWS = ['a', 'b', 'c', 'd'];

/** Mirrors the dashboard layout while its first summary loads. */
export function DashboardSkeleton() {
  return (
    <div className="dashboard__content" aria-busy="true" aria-label="Loading dashboard">
      <SummaryCards />
      <div className="dashboard__charts">
        <div className="card">
          <Skeleton width="40%" height="1.25rem" />
          <Skeleton className="dashboard__chart-placeholder" height="16rem" />
        </div>
        <div className="card">
          <Skeleton width="40%" height="1.25rem" />
          <Skeleton className="dashboard__chart-placeholder" height="16rem" />
        </div>
      </div>
      <div className="card stack-sm">
        <Skeleton width="30%" height="1.25rem" />
        {PLACEHOLDER_ROWS.map((row) => (
          <Skeleton key={row} height="2.75rem" />
        ))}
      </div>
    </div>
  );
}
