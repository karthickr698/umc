import type { WorkerType } from '../constants/domain.js';
import type { Paginated } from './api.js';

/**
 * Filters shared by every worker summary. Assignments are filtered on `date`, payments on
 * `paymentDate`. With `siteId`, payments not tied to a site are left out.
 */
export interface WorkerSummaryQuery {
  siteId?: string;
  /** Inclusive calendar-day range, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
}

/** `GET /worker-summaries`. */
export interface ListWorkerSummariesQuery extends WorkerSummaryQuery {
  page?: number;
  pageSize?: number;
  workerType?: WorkerType;
}

/**
 * Money is in the company's currency, rounded to two decimals. Only SCHEDULED and COMPLETED
 * assignments count; cancelled ones are ignored. Every payment type (work payments, advances,
 * other) counts as paid.
 */
export interface WorkerFinancialTotals {
  assignedDays: number;
  /** Sum of each assignment's snapshotted daily rate. */
  earnedAmount: number;
  paidAmount: number;
  /** `earnedAmount - paidAmount`; negative when the worker has been paid ahead (e.g. advances). */
  outstandingAmount: number;
}

export interface WorkerSummaryWorker {
  /** Employee or contractor employee id, depending on `workerType`. */
  id: string;
  workerType: WorkerType;
  name: string;
  employeeCode: string;
  /** Set for contractor employees. */
  contractorId?: string;
  /** Set in worker lists for contractor employees whose contractor still exists. */
  contractorName?: string;
}

export interface WorkerSiteSummary extends WorkerFinancialTotals {
  /** `null` groups payments not tied to a site. */
  siteId: string | null;
  siteName?: string;
  siteCode?: string;
}

/** `GET /worker-summaries/:workerId`; the id may be an employee or contractor employee. */
export interface WorkerFinancialSummaryDto {
  worker: WorkerSummaryWorker;
  filters: WorkerSummaryQuery;
  totals: WorkerFinancialTotals;
  /** Per-site breakdown, highest outstanding amount first. */
  sites: WorkerSiteSummary[];
}

export interface WorkerSummaryListItem {
  worker: WorkerSummaryWorker;
  totals: WorkerFinancialTotals;
}

/**
 * `GET /worker-summaries`: one row per worker with any assignment or payment matching the
 * filters, highest outstanding amount first. `totals` covers every matching worker, not just
 * the current page.
 */
export interface WorkerSummaryListDto extends Paginated<WorkerSummaryListItem> {
  filters: Omit<ListWorkerSummariesQuery, 'page' | 'pageSize'>;
  totals: WorkerFinancialTotals & { workerCount: number };
}
