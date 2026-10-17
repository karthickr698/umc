/**
 * Filters of the site financial report. Client receipts are filtered on `receivedDate`, worker
 * payments on `paymentDate` and expenses on `expenseDate`. With `siteId`, receipts and payments
 * not tied to a site are left out.
 */
export interface SiteFinancialReportFilters {
  /** Inclusive calendar-day range, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
  siteId?: string;
}

/** `GET /reports/site-financial`; `GET /reports/site-financial/export` takes the same filters. */
export type SiteFinancialReportQuery = SiteFinancialReportFilters;

/**
 * Amounts are in the company's currency, rounded to two decimals. Employee payments are payments
 * to the company's own employees, contractor payments those to contractor employees; every payment
 * type (work payments, advances, other) counts. Other expenses are every non-`MATERIAL` category.
 */
export interface SiteFinancialTotals {
  clientReceipts: number;
  employeePayments: number;
  contractorPayments: number;
  materialExpenses: number;
  otherExpenses: number;
  /** `employeePayments + contractorPayments + materialExpenses + otherExpenses`. */
  totalExpenses: number;
  /** `clientReceipts - totalExpenses`. */
  balance: number;
}

export interface SiteFinancialReportRow extends SiteFinancialTotals {
  /** `null` groups receipts and payments not tied to a site. */
  siteId: string | null;
  siteName?: string;
  siteCode?: string;
}

/**
 * One row per site with any receipt, payment or expense matching the filters, sorted by site
 * name; the `null` site row comes last. `totals` covers every row.
 */
export interface SiteFinancialReportDto {
  filters: SiteFinancialReportFilters;
  totals: SiteFinancialTotals & { siteCount: number };
  sites: SiteFinancialReportRow[];
}
