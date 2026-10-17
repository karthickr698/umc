import { INVOICE_STATUSES, type InvoiceStatus } from '@umc/shared';
import { INVOICE_STATUS_LABELS } from '@/config/labels';

const TONES: Readonly<Record<InvoiceStatus, string>> = {
  [INVOICE_STATUSES.PENDING]: 'warn',
  [INVOICE_STATUSES.GENERATED]: 'ok',
  [INVOICE_STATUSES.FAILED]: 'error',
  [INVOICE_STATUSES.CANCELLED]: 'neutral',
};

/** `status` is absent for payments that have no invoice. */
export function InvoiceStatusBadge({ status }: { status?: InvoiceStatus }) {
  if (!status) return <span className="badge badge--neutral">Not generated</span>;
  return <span className={`badge badge--${TONES[status]}`}>{INVOICE_STATUS_LABELS[status]}</span>;
}
