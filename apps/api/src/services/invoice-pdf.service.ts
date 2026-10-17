import type { Readable } from 'node:stream';
import { INVOICE_STATUSES, type TenantUserDto } from '@umc/shared';
import { PDF_CONTENT_TYPE } from '../lib/pdf/pdf-renderer.js';
import { buildStorageKey, storage } from '../lib/storage/index.js';
import * as invoiceRepository from '../repositories/invoice.repository.js';
import type { InvoiceRecord } from '../repositories/invoice.repository.js';
import type { PaymentRecord } from '../repositories/payment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { deleteStoredFiles } from './attachment.service.js';
import { renderInvoicePdf, type InvoiceContext } from './invoice-document.service.js';

export const INVOICE_NOT_FOUND = 'Invoice not found';

/**
 * Renders and stores the PDF, then records it on the invoice. On failure the invoice is marked
 * FAILED and keeps any previous PDF, so it can be retried by regenerating it.
 */
export async function generatePdf(
  companyId: string,
  invoice: InvoiceRecord,
  payment: PaymentRecord,
  context: InvoiceContext,
): Promise<InvoiceRecord> {
  const id = invoice._id.toString();
  const generatedAt = new Date();
  const key = buildStorageKey({
    folder: `companies/${companyId}/invoices`,
    originalName: 'invoice.pdf',
    date: generatedAt,
  });

  try {
    const pdf = await renderInvoicePdf(companyId, invoice, payment, context, generatedAt);
    await storage.upload({ key, body: pdf, contentType: PDF_CONTENT_TYPE });
  } catch (err) {
    await invoiceRepository.updateInCompany(companyId, id, { status: INVOICE_STATUSES.FAILED });
    throw ApiError.serviceUnavailable(
      'The invoice PDF could not be generated; try regenerating it',
      { invoiceId: id },
      err,
    );
  }

  const updated = await invoiceRepository.updateInCompany(companyId, id, {
    status: INVOICE_STATUSES.GENERATED,
    pdfKey: key,
    generatedAt,
  });
  if (!updated) {
    await deleteStoredFiles([{ key }]);
    throw ApiError.notFound(INVOICE_NOT_FOUND);
  }
  if (invoice.pdfKey && invoice.pdfKey !== key) await deleteStoredFiles([{ key: invoice.pdfKey }]);
  return updated;
}

export interface InvoicePdf {
  body: Readable;
  size: number;
  contentType: string;
  fileName: string;
}

/** Opens the stored PDF of an invoice for streaming. */
export async function openPdf(actor: TenantUserDto, id: string): Promise<InvoicePdf> {
  const invoice = await invoiceRepository.findByIdInCompany(actor.companyId, id);
  if (!invoice) throw ApiError.notFound(INVOICE_NOT_FOUND);
  if (!invoice.pdfKey) {
    throw ApiError.conflict('The invoice PDF has not been generated yet', {
      status: invoice.status,
    });
  }

  const file = await storage.read(invoice.pdfKey);
  if (!file) throw ApiError.notFound('Invoice PDF file not found; regenerate the invoice');
  return { ...file, contentType: PDF_CONTENT_TYPE, fileName: `${invoice.invoiceNumber}.pdf` };
}
