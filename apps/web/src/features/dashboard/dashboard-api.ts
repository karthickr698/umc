import { API_ROUTES, PAGINATION, type DashboardSummaryQuery } from '@umc/shared';
import { withQuery } from '@/utils/query-string';

const { dashboard, sites, clients, employees, contractors } = API_ROUTES;

/** Filter dropdowns list the first page at the largest allowed size. */
const OPTIONS_PAGE = { page: PAGINATION.defaultPage, pageSize: PAGINATION.maxPageSize };

/** API paths used by the dashboard, relative to the API base URL. */
export const DASHBOARD_API = {
  summary: (query: DashboardSummaryQuery) =>
    withQuery(`${dashboard.base}${dashboard.summary}`, { ...query }),
  siteOptions: (clientId?: string) => withQuery(sites.base, { ...OPTIONS_PAGE, clientId }),
  clientOptions: () => withQuery(clients.base, OPTIONS_PAGE),
  employeeOptions: () => withQuery(employees.base, OPTIONS_PAGE),
  contractorOptions: () => withQuery(contractors.base, OPTIONS_PAGE),
};
