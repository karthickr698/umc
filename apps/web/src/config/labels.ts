import { INVOICE_STATUSES, type InvoiceStatus } from '@umc/shared';

// Shared with the API, which prints them on invoice PDFs.
export { PAYMENT_MODE_LABELS, PAYMENT_TYPE_LABELS } from '@umc/shared';

export const INVOICE_STATUS_LABELS: Readonly<Record<InvoiceStatus, string>> = {
  [INVOICE_STATUSES.PENDING]: 'Generating',
  [INVOICE_STATUSES.GENERATED]: 'Generated',
  [INVOICE_STATUSES.FAILED]: 'Failed',
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
};
