import type { PaymentMode, PaymentType, WORKER_TYPES, WorkerType } from '../constants/domain.js';
import type { InvoiceDto, PaymentDto } from './domain.js';

interface PaymentFields {
  /**
   * Optional. When set it must belong to the caller's company, and the worker must have a
   * SCHEDULED or COMPLETED work assignment at that site.
   */
  siteId?: string;
  /** Between `MONEY_LIMITS.minAmount` and `maxAmount`, at most two decimal places. */
  amount: number;
  /** Calendar day, `YYYY-MM-DD`. */
  paymentDate: string;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  description?: string;
}

/**
 * The new payment always belongs to the caller's company, and every referenced record must be in
 * that company too.
 */
export type CreatePaymentRequest =
  | (PaymentFields & {
      workerType: typeof WORKER_TYPES.EMPLOYEE;
      employeeId: string;
    })
  | (PaymentFields & {
      workerType: typeof WORKER_TYPES.CONTRACTOR_EMPLOYEE;
      contractorEmployeeId: string;
      /** Derived from the contractor employee; when sent it must match. */
      contractorId?: string;
    });

/**
 * `workerType` cannot change; send the id field matching the payment's worker type. The
 * worker/site relationship is re-checked whenever the worker or site changes.
 */
export interface UpdatePaymentRequest {
  /** `null` detaches the payment from its site. */
  siteId?: string | null;
  employeeId?: string;
  contractorEmployeeId?: string;
  amount?: number;
  paymentDate?: string;
  paymentType?: PaymentType;
  paymentMode?: PaymentMode;
  /** An empty string clears the stored value. */
  referenceNumber?: string;
  /** An empty string clears the stored value. */
  description?: string;
}

export interface ListPaymentsQuery {
  page?: number;
  pageSize?: number;
  siteId?: string;
  workerType?: WorkerType;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  paymentType?: PaymentType;
  paymentMode?: PaymentMode;
  /** Inclusive calendar-day range on `paymentDate`, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
}

/** `GET /payments/history` takes the same filters as `GET /payments`. */
export type PaymentHistoryQuery = ListPaymentsQuery;

/**
 * One row of `GET /payments/history`: a payment plus the names needed to show it. A name is
 * absent when the payment has no such reference or the referenced record no longer exists.
 */
export interface PaymentHistoryItemDto extends PaymentDto {
  siteName?: string;
  siteCode?: string;
  workerName?: string;
  /** Employee code of the employee or contractor employee. */
  workerCode?: string;
  contractorName?: string;
  /** The invoice issued for the payment; absent when none was generated. */
  invoice?: InvoiceDto;
}
