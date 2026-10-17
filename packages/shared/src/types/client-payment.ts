import type { PaymentMode } from '../constants/domain.js';

/**
 * The new receipt always belongs to the caller's company, and the client (and site, when sent)
 * must be in that company too.
 */
export interface CreateClientPaymentRequest {
  clientId: string;
  /** Optional. When set, the site must belong to `clientId`. */
  siteId?: string;
  /** Between `MONEY_LIMITS.minAmount` and `maxAmount`, at most two decimal places. */
  amount: number;
  /** Calendar day, `YYYY-MM-DD`. */
  receivedDate: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  description?: string;
}

/** The site must belong to the resulting client whenever the client or site changes. */
export interface UpdateClientPaymentRequest {
  clientId?: string;
  /** `null` detaches the receipt from its site. */
  siteId?: string | null;
  amount?: number;
  receivedDate?: string;
  paymentMode?: PaymentMode;
  /** An empty string clears the stored value. */
  referenceNumber?: string;
  /** An empty string clears the stored value. */
  description?: string;
}

/** Filters shared by the receipt list and the receipt summary. */
export interface ClientPaymentFilterQuery {
  clientId?: string;
  /** Receipts not tied to a site are left out when set. */
  siteId?: string;
  paymentMode?: PaymentMode;
  /** Inclusive calendar-day range on `receivedDate`, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
}

/** `GET /client-payments`: newest `receivedDate` first. */
export interface ListClientPaymentsQuery extends ClientPaymentFilterQuery {
  page?: number;
  pageSize?: number;
}

/** Amounts are in the company's currency, rounded to two decimals. */
export interface ClientReceiptTotals {
  totalAmount: number;
  paymentCount: number;
}

export interface ClientReceiptsByClient extends ClientReceiptTotals {
  clientId: string;
  clientName?: string;
}

export interface ClientReceiptsBySite extends ClientReceiptTotals {
  /** `null` groups receipts not tied to a site. */
  siteId: string | null;
  siteName?: string;
  siteCode?: string;
}

export interface ClientReceiptsByPaymentMode extends ClientReceiptTotals {
  paymentMode: PaymentMode;
}

/**
 * `GET /client-payments/summary`: totals over every receipt matching the filters, with
 * breakdowns sorted by highest `totalAmount` first.
 */
export interface ClientPaymentSummaryDto {
  filters: ClientPaymentFilterQuery;
  totals: ClientReceiptTotals;
  byClient: ClientReceiptsByClient[];
  bySite: ClientReceiptsBySite[];
  byPaymentMode: ClientReceiptsByPaymentMode[];
}
