import { RotateCw } from 'lucide-react';
import { INVOICE_STATUSES, INVOICE_WHATSAPP_STATUSES } from '@umc/shared';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { Spinner } from '@/components/feedback/spinner';
import { describeError } from '@/utils/describe-error';
import { usePaymentInvoice } from '../hooks/use-payment-invoice';
import type { PaymentReceipt } from '../lib/payment-receipt';
import { InvoiceActions } from './invoice-actions';
import { WhatsappStatusBadge } from './whatsapp-status-badge';

const GENERATION_FAILED = 'The invoice PDF could not be generated.';

/** The PDF invoice issued with the payment: download, share and WhatsApp, or retry if it failed. */
export function ReceiptActions({ receipt }: { receipt: PaymentReceipt }) {
  const { invoice, loading, error, failed, retry } = usePaymentInvoice(receipt.payment.id);

  return (
    <div className="receipt-actions no-print">
      <div className="receipt-actions__header">
        <h3 className="receipt-actions__title">
          Invoice
          {invoice && <span className="receipt-actions__number"> {invoice.invoiceNumber}</span>}
        </h3>
        {invoice && invoice.whatsappStatus !== INVOICE_WHATSAPP_STATUSES.NOT_SENT && (
          <WhatsappStatusBadge status={invoice.whatsappStatus} />
        )}
      </div>

      {invoice?.status === INVOICE_STATUSES.GENERATED && <InvoiceActions invoice={invoice} />}

      {loading && <Spinner size={18} label="Preparing invoice" />}

      {failed && (
        <>
          <InlineAlert tone="error" title="The invoice could not be generated">
            <p>{error !== undefined ? describeError(error).message : GENERATION_FAILED}</p>
          </InlineAlert>
          <button type="button" className="button button--primary button--block" onClick={retry}>
            <RotateCw size={18} aria-hidden />
            Try again
          </button>
        </>
      )}
    </div>
  );
}
