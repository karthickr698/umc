import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as invoicePdfService from '../services/invoice-pdf.service.js';
import * as invoiceService from '../services/invoice.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { sendFile, type FileDownload } from '../utils/send-file.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createInvoiceSchema,
  listInvoicesQuerySchema,
  regenerateInvoiceSchema,
  sendInvoiceWhatsappSchema,
} from '../validators/invoice.validator.js';

export async function listInvoices(req: Request, res: Response): Promise<void> {
  const query = listInvoicesQuerySchema.parse(req.query);
  sendSuccess(res, await invoiceService.list(getAuthUser(req), query));
}

export async function getInvoice(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await invoiceService.getById(getAuthUser(req), id));
}

export async function createInvoice(req: Request, res: Response): Promise<void> {
  const input = createInvoiceSchema.parse(req.body);
  sendSuccess(res, await invoiceService.create(getAuthUser(req), input), 201);
}

export async function regenerateInvoice(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  // Express leaves `req.body` undefined when the request has no body.
  const input = regenerateInvoiceSchema.parse(req.body ?? {});
  sendSuccess(res, await invoiceService.regenerate(getAuthUser(req), id, input));
}

export async function sendInvoiceWhatsapp(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = sendInvoiceWhatsappSchema.parse(req.body ?? {});
  sendSuccess(res, await invoiceService.sendWhatsapp(getAuthUser(req), id, input));
}

async function sendInvoicePdf(
  req: Request,
  res: Response,
  disposition: FileDownload['disposition'],
): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const pdf = await invoicePdfService.openPdf(getAuthUser(req), id);
  await sendFile(req, res, { ...pdf, disposition });
}

export function viewInvoicePdf(req: Request, res: Response): Promise<void> {
  return sendInvoicePdf(req, res, 'inline');
}

export function downloadInvoicePdf(req: Request, res: Response): Promise<void> {
  return sendInvoicePdf(req, res, 'attachment');
}
