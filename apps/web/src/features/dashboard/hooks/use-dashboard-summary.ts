import type { DashboardSummaryDto, DashboardSummaryQuery } from '@umc/shared';
import { useApiQuery } from '@/hooks/use-api-query';
import { DASHBOARD_API } from '../dashboard-api';

export function useDashboardSummary(query: DashboardSummaryQuery) {
  return useApiQuery<DashboardSummaryDto>(DASHBOARD_API.summary(query));
}
