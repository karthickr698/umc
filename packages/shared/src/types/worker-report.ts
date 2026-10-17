import type { Paginated } from './api.js';
import type { WorkerFinancialTotals, WorkerSummaryListItem } from './worker-summary.js';

/**
 * Filters of the worker financial report. Assignments are filtered on `date`, payments on
 * `paymentDate`; with `siteId`, payments not tied to a site are left out. `employeeId` cannot be
 * combined with `contractorId` or `contractorEmployeeId`; when both of the latter are sent, the
 * contractor employee must belong to that contractor.
 */
export interface WorkerFinancialReportFilters {
  /** Inclusive calendar-day range, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
  siteId?: string;
  employeeId?: string;
  /** Every worker supplied by this contractor. */
  contractorId?: string;
  contractorEmployeeId?: string;
}

/** `GET /reports/worker-financial`. `GET /reports/worker-financial/export` takes only the filters. */
export interface WorkerFinancialReportQuery extends WorkerFinancialReportFilters {
  page?: number;
  pageSize?: number;
}

/**
 * One row per worker with any assignment or payment matching the filters, highest outstanding
 * amount first. `totals` covers every matching worker, not just the current page. Work days,
 * earned, paid and outstanding amounts follow `WorkerFinancialTotals`.
 */
export interface WorkerFinancialReportDto extends Paginated<WorkerSummaryListItem> {
  filters: WorkerFinancialReportFilters;
  totals: WorkerFinancialTotals & { workerCount: number };
}
