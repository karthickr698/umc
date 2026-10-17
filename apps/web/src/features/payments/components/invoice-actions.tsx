import { useState } from 'react';
import { Download, MessageCircle, Share2 } from 'lucide-react';
import { INVOICE_WHATSAPP_STATUSES, type InvoiceDto } from '@umc/shared';
import { Spinner } from '@/components/feedback/spinner';
import { useInvoiceFileActions } from '../hooks/use-invoice-file-actions';
import { FileActionAlert } from './file-action-alert';
import { WhatsappSendPanel } from './whatsapp-send-panel';

/** Download, share and WhatsApp actions of a generated invoice. */
export function InvoiceActions({ invoice }: { invoice: InvoiceDto }) {
  const files = useInvoiceFileActions(invoice);
  const [whatsappOpen, setWhatsappOpen] = useState(
    invoice.whatsappStatus === INVOICE_WHATSAPP_STATUSES.FAILED,
  );

  return (
    <>
      <div className="receipt-actions__buttons">
        <button
          type="button"
          className="button receipt-actions__button"
          onClick={files.download}
          disabled={files.busy !== null}
        >
          {files.busy === 'download' ? (
            <Spinner size={18} label="Downloading" />
          ) : (
            <Download size={18} aria-hidden />
          )}
          Download PDF
        </button>
        <button
          type="button"
          className="button receipt-actions__button"
          onClick={files.share}
          disabled={files.busy !== null}
        >
          {files.busy === 'share' ? (
            <Spinner size={18} label="Preparing" />
          ) : (
            <Share2 size={18} aria-hidden />
          )}
          Share
        </button>
        <button
          type="button"
          className="button receipt-actions__button"
          aria-expanded={whatsappOpen}
          onClick={() => setWhatsappOpen((open) => !open)}
        >
          <MessageCircle size={18} aria-hidden />
          WhatsApp
        </button>
      </div>

      {files.result && <FileActionAlert result={files.result} onDismiss={files.clearResult} />}

      {whatsappOpen && <WhatsappSendPanel invoice={invoice} onShareManually={files.share} />}
    </>
  );
}
