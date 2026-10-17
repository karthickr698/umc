import type { PaymentDto } from '@umc/shared';
import { PAYMENT_MODE_LABELS, PAYMENT_TYPE_LABELS } from '@/config/labels';
import { formatCalendarDate } from '@/utils/format';

const INVOICE_NUMBER_LENGTH = 8;

/** A saved payment plus the names needed to show and share it without further lookups. */
export interface PaymentReceipt {
  payment: PaymentDto;
  workerName: string;
  workerCode: string;
  contractorName?: string;
  siteName: string;
}

/** Short, stable number derived from the payment id, e.g. `PAY-3F9A12BC`. */
export function invoiceNumber(payment: PaymentDto): string {
  return `PAY-${payment.id.slice(-INVOICE_NUMBER_LENGTH).toUpperCase()}`;
}

export interface ReceiptLine {
  label: string;
  value: string;
}

/** Everything except amount, worker and site, in display order; unset fields are left out. */
export function receiptDetails({ payment, contractorName }: PaymentReceipt): ReceiptLine[] {
  const lines: (ReceiptLine | false)[] = [
    { label: 'Invoice no.', value: invoiceNumber(payment) },
    contractorName !== undefined && { label: 'Contractor', value: contractorName },
    { label: 'Date', value: formatCalendarDate(payment.paymentDate) },
    { label: 'Type', value: PAYMENT_TYPE_LABELS[payment.paymentType] },
    { label: 'Mode', value: PAYMENT_MODE_LABELS[payment.paymentMode] },
    payment.referenceNumber !== undefined && {
      label: 'Reference',
      value: payment.referenceNumber,
    },
    payment.description !== undefined && { label: 'Note', value: payment.description },
  ];
  return lines.filter((line): line is ReceiptLine => line !== false);
}
