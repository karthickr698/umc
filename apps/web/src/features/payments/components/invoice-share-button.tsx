import { MessageCircle } from 'lucide-react';
import type { InvoiceDto } from '@umc/shared';
import { Spinner } from '@/components/feedback/spinner';
import { useInvoiceFileActions, type FileActionResult } from '../hooks/use-invoice-file-actions';

export interface InvoiceShareButtonProps {
  invoice: InvoiceDto;
  onResult: (result: FileActionResult | null) => void;
}

/**
 * Shares the invoice PDF through the device's share sheet (pick WhatsApp there); where files
 * cannot be shared, downloads it and opens the worker's WhatsApp chat.
 */
export function InvoiceShareButton({ invoice, onResult }: InvoiceShareButtonProps) {
  const files = useInvoiceFileActions(invoice, { prefetch: false, onResult });
  const sharing = files.busy === 'share';

  return (
    <button
      type="button"
      className="button button--small"
      title={`Share invoice ${invoice.invoiceNumber} on WhatsApp`}
      onClick={files.share}
      disabled={files.busy !== null}
    >
      {sharing ? <Spinner size={14} label="Preparing" /> : <MessageCircle size={14} aria-hidden />}
      WhatsApp
    </button>
  );
}
