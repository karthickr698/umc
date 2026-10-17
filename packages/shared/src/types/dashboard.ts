import type {
  ExpenseCategory,
  PaymentMode,
  PaymentType,
  TransactionKind,
  TrendInterval,
} from '../constants/domain.js';

/**
 * `GET /dashboard/summary` filters. Each filter narrows only the records that carry its
 * dimension:
 * - `siteId` applies to everything; records not tied to a site are left out.
 * - `clientId` matches client payments on their client, and worker payments and expenses on the
 *   client's sites. When both are sent, the site must belong to the client.
 * - `employeeId` narrows worker payments only; `contractorId` narrows contractor payments only.
 */
export interface DashboardSummaryQuery {
  siteId?: string;
  clientId?: string;
  employeeId?: string;
  contractorId?: string;
  /**
   * Inclusive calendar-day range, `YYYY-MM-DD`, on `receivedDate`, `paymentDate` and
   * `expenseDate`.
   */
  from?: string;
  to?: string;
}

/**
 * Amounts are in the company's currency, rounded to two decimals. Worker payments are payments to
 * the company's own employees; contractor payments are payments to contractor employees. Every
 * payment type (work payments, advances, other) counts.
 */
export interface DashboardTotals {
  clientPaymentsReceived: number;
  workerPayments: number;
  contractorPayments: number;
  expenses: number;
  /** `clientPaymentsReceived - workerPayments - contractorPayments - expenses`. */
  balance: number;
}

export interface DashboardSiteTotals extends DashboardTotals {
  /** `null` groups records not tied to a site. */
  siteId: string | null;
  siteName?: string;
  siteCode?: string;
}

export interface DashboardPaymentTotals {
  totalAmount: number;
  paymentCount: number;
}

export interface DashboardWorkerTotals extends DashboardPaymentTotals {
  employeeId: string;
  name?: string;
  employeeCode?: string;
}

export interface DashboardContractorTotals extends DashboardPaymentTotals {
  contractorId: string;
  name?: string;
}

export interface DashboardTrendPoint extends DashboardTotals {
  /** `YYYY-MM-DD` for `DAY` buckets, `YYYY-MM` for `MONTH` buckets. */
  period: string;
}

/**
 * Buckets with at least one record, oldest first; periods without records are omitted. `DAY` when
 * the date range spans at most `DASHBOARD_LIMITS.maxDailyTrendDays`, otherwise `MONTH`.
 */
export interface DashboardTrend {
  interval: TrendInterval;
  points: DashboardTrendPoint[];
}

/** One client receipt, worker payment, contractor payment or expense. */
export interface DashboardTransactionDto {
  /** Id of the client payment, payment or expense. */
  id: string;
  kind: TransactionKind;
  /** Calendar day, `YYYY-MM-DD`. */
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  siteId?: string;
  siteName?: string;
  siteCode?: string;
  /** Client, employee, contractor or vendor the money moved with. */
  counterparty?: string;
  /** Set on worker and contractor payments. */
  paymentType?: PaymentType;
  /** Set on expenses. */
  expenseCategory?: ExpenseCategory;
  description?: string;
}

/**
 * `GET /dashboard/summary`. `bySite` is sorted by highest `clientPaymentsReceived` first;
 * `byWorker` and `byContractor` by highest `totalAmount` first. `recentTransactions` holds the
 * latest `DASHBOARD_LIMITS.recentTransactions` records, newest first.
 */
export interface DashboardSummaryDto {
  filters: DashboardSummaryQuery;
  totals: DashboardTotals;
  bySite: DashboardSiteTotals[];
  byWorker: DashboardWorkerTotals[];
  byContractor: DashboardContractorTotals[];
  trend: DashboardTrend;
  recentTransactions: DashboardTransactionDto[];
}
