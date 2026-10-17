import {
  API_ROUTES,
  type CreateInvoiceRequest,
  type InvoiceDto,
  type SendInvoiceWhatsappRequest,
} from '@umc/shared';
import { apiFile, apiRequest } from '@/lib/api-client';
import { withQuery } from '@/utils/query-string';

const { invoices } = API_ROUTES;

function invoicePath(route: string, id: string): string {
  return `${invoices.base}${route.replace(':id', encodeURIComponent(id))}`;
}

/** API paths of one invoice, relative to the API base URL. */
export const INVOICES_API = {
  invoices: invoices.base,
  /** A payment has at most one invoice. */
  byPayment: (paymentId: string) => withQuery(invoices.base, { paymentId, pageSize: 1 }),
  byId: (id: string) => invoicePath(invoices.byId, id),
  download: (id: string) => invoicePath(invoices.download, id),
  regenerate: (id: string) => invoicePath(invoices.regenerate, id),
  sendWhatsapp: (id: string) => invoicePath(invoices.sendWhatsapp, id),
};

export function createInvoice(request: CreateInvoiceRequest): Promise<InvoiceDto> {
  return apiRequest(INVOICES_API.invoices, { method: 'POST', body: JSON.stringify(request) });
}

/** Re-renders the PDF from the payment's current data; also retries a FAILED generation. */
export function regenerateInvoice(id: string): Promise<InvoiceDto> {
  return apiRequest(INVOICES_API.regenerate(id), { method: 'POST' });
}

export function sendInvoiceWhatsapp(
  id: string,
  request: SendInvoiceWhatsappRequest,
): Promise<InvoiceDto> {
  return apiRequest(INVOICES_API.sendWhatsapp(id), {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export interface InvoicePdfFile {
  blob: Blob;
  fileName: string;
}

export async function downloadInvoicePdf(invoice: InvoiceDto): Promise<InvoicePdfFile> {
  const { blob, fileName } = await apiFile(INVOICES_API.download(invoice.id));
  return { blob, fileName: fileName ?? `${invoice.invoiceNumber}.pdf` };
}
