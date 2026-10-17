import type { ExpenseCategory, PaymentMode } from '../constants/domain.js';

/** The new expense always belongs to the caller's company, and so must its site. */
export interface CreateExpenseRequest {
  siteId: string;
  category: ExpenseCategory;
  vendorName?: string;
  /** Between `MONEY_LIMITS.minAmount` and `maxAmount`, at most two decimal places. */
  amount: number;
  /** Calendar day, `YYYY-MM-DD`. */
  expenseDate: string;
  paymentMode: PaymentMode;
  description?: string;
}

export interface UpdateExpenseRequest {
  siteId?: string;
  category?: ExpenseCategory;
  /** An empty string clears the stored value. */
  vendorName?: string;
  amount?: number;
  expenseDate?: string;
  paymentMode?: PaymentMode;
  /** An empty string clears the stored value. */
  description?: string;
}

export interface ListExpensesQuery {
  page?: number;
  pageSize?: number;
  siteId?: string;
  category?: ExpenseCategory;
  /** Inclusive calendar-day range on `expenseDate`, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
}
