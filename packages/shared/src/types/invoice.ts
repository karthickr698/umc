import type { InvoiceRecipientType, InvoiceStatus } from '../constants/domain.js';
import type { CalendarDateRange } from './domain.js';

/**
 * Issues the invoice of a worker payment and renders its PDF. A payment has at most one invoice;
 * use the regenerate endpoint to re-render it after the payment changes.
 */
export interface CreateInvoiceRequest {
  /** A payment of the caller's company. */
  paymentId: string;
  /** Calendar day, `YYYY-MM-DD`; defaults to the payment date. */
  invoiceDate?: string;
  /**
   * When set, the worker's SCHEDULED and COMPLETED assignments in this period (at the payment's
   * site, if it has one) are listed on the invoice. At most `INVOICE_LIMITS.maxWorkPeriodDays`.
   */
  workPeriod?: CalendarDateRange;
  /** Description of the work paid for; defaults to the payment's description. */
  workDetails?: string;
  notes?: string;
  /**
   * Also send the PDF to the recipient's phone on file over WhatsApp. A failed send does not
   * fail the request: the invoice is returned with `whatsappStatus` `FAILED` and `whatsappError`.
   */
  sendWhatsapp?: boolean;
}

/** Sends the invoice PDF as a WhatsApp document, regenerating the PDF first if it is missing. */
export interface SendInvoiceWhatsappRequest {
  /**
   * Destination with country code, e.g. `+91 98765 43210`; defaults to the recipient's phone
   * on file.
   */
  phone?: string;
}

/**
 * Re-renders the PDF from the payment's current data, keeping the invoice number. Omitted fields
 * keep their stored value.
 */
export interface RegenerateInvoiceRequest {
  invoiceDate?: string;
  /** `null` removes the work period. */
  workPeriod?: CalendarDateRange | null;
  /** An empty string clears the stored value. */
  workDetails?: string;
  /** An empty string clears the stored value. */
  notes?: string;
}

export interface ListInvoicesQuery {
  page?: number;
  pageSize?: number;
  paymentId?: string;
  siteId?: string;
  status?: InvoiceStatus;
  recipientType?: InvoiceRecipientType;
  /** Matches the invoice number or recipient name. */
  search?: string;
  /** Inclusive calendar-day range on `invoiceDate`, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
}
