import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { INVOICE_STATUSES, type InvoiceDto } from '@umc/shared';
import { saveFile } from '@/lib/save-file';
import { downloadInvoicePdf, type InvoicePdfFile } from '../invoices-api';
import { invoiceShareText, whatsappChatUrl } from '../lib/invoice-share';

const PDF_TYPE = 'application/pdf';

export type FileActionResult =
  | { kind: 'downloaded' }
  | { kind: 'shared' }
  /** No file sharing here: the PDF was saved and WhatsApp opened to attach it by hand. */
  | { kind: 'downloaded-for-share' }
  | { kind: 'error'; error: unknown };

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function pdfQueryKey(invoice: InvoiceDto) {
  // A regenerated PDF gets a new `generatedAt`, so it is never served from a stale cache.
  return ['invoice-pdf', invoice.id, invoice.generatedAt] as const;
}

export interface InvoiceFileActionsOptions {
  /**
   * Fetch the PDF up front (default true) so sharing starts right away: browsers only allow the
   * share sheet shortly after a tap, which a slow download could outlast. Turn off in lists.
   */
  prefetch?: boolean;
  /** Also told about each outcome, e.g. to show it outside the component. */
  onResult?: (result: FileActionResult | null) => void;
}

/** Download the invoice PDF, or share it through the device's share sheet. */
export function useInvoiceFileActions(
  invoice: InvoiceDto,
  { prefetch = true, onResult }: InvoiceFileActionsOptions = {},
) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [result, setResultState] = useState<FileActionResult | null>(null);
  const ready = invoice.status === INVOICE_STATUSES.GENERATED;

  const setResult = (next: FileActionResult | null) => {
    setResultState(next);
    onResult?.(next);
  };

  useQuery({
    queryKey: pdfQueryKey(invoice),
    queryFn: () => downloadInvoicePdf(invoice),
    enabled: ready && prefetch,
    staleTime: Infinity,
  });

  const getPdf = (): Promise<InvoicePdfFile> =>
    queryClient.fetchQuery({
      queryKey: pdfQueryKey(invoice),
      queryFn: () => downloadInvoicePdf(invoice),
      staleTime: Infinity,
    });

  const run = async (
    action: 'download' | 'share',
    task: () => Promise<FileActionResult | null>,
  ) => {
    setBusy(action);
    setResult(null);
    try {
      setResult(await task());
    } catch (error) {
      setResult({ kind: 'error', error });
    } finally {
      setBusy(null);
    }
  };

  const download = () =>
    run('download', async () => {
      const { blob, fileName } = await getPdf();
      saveFile(blob, fileName);
      return { kind: 'downloaded' };
    });

  const share = () =>
    run('share', async () => {
      const { blob, fileName } = await getPdf();
      const file = new File([blob], fileName, { type: PDF_TYPE });
      const data: ShareData = {
        files: [file],
        title: `Invoice ${invoice.invoiceNumber}`,
        text: invoiceShareText(invoice),
      };
      if (navigator.canShare?.(data)) {
        try {
          await navigator.share(data);
          return { kind: 'shared' };
        } catch (error) {
          if (isAbort(error)) return null;
          // e.g. NotAllowedError when the tap "expired"; fall through to the manual route.
        }
      }
      saveFile(blob, fileName);
      window.open(whatsappChatUrl(invoice), '_blank', 'noopener,noreferrer');
      return { kind: 'downloaded-for-share' };
    });

  return {
    ready,
    busy,
    result,
    download: () => void download(),
    share: () => void share(),
    clearResult: () => setResult(null),
  };
}
