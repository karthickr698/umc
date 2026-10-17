import {
  INVOICE_WHATSAPP_STATUS_LABELS,
  INVOICE_WHATSAPP_STATUSES,
  type InvoiceWhatsappStatus,
} from '@umc/shared';

const TONES: Readonly<Record<InvoiceWhatsappStatus, 'ok' | 'warn' | 'error' | 'neutral'>> = {
  [INVOICE_WHATSAPP_STATUSES.NOT_SENT]: 'neutral',
  [INVOICE_WHATSAPP_STATUSES.QUEUED]: 'warn',
  [INVOICE_WHATSAPP_STATUSES.SENT]: 'ok',
  [INVOICE_WHATSAPP_STATUSES.DELIVERED]: 'ok',
  [INVOICE_WHATSAPP_STATUSES.READ]: 'ok',
  [INVOICE_WHATSAPP_STATUSES.FAILED]: 'error',
};

export function WhatsappStatusBadge({ status }: { status: InvoiceWhatsappStatus }) {
  return (
    <span className={`badge badge--${TONES[status]}`}>
      WhatsApp: {INVOICE_WHATSAPP_STATUS_LABELS[status]}
    </span>
  );
}
