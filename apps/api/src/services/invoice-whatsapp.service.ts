import { buffer } from 'node:stream/consumers';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  INVOICE_WHATSAPP_STATUSES,
  type TenantUserDto,
} from '@umc/shared';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { PDF_CONTENT_TYPE } from '../lib/pdf/pdf-renderer.js';
import { storage } from '../lib/storage/index.js';
import {
  WHATSAPP_ERROR_CODES,
  WhatsAppError,
  toWhatsAppNumber,
  whatsapp,
  type WhatsAppSendResult,
} from '../lib/whatsapp/index.js';
import * as invoiceRepository from '../repositories/invoice.repository.js';
import type { InvoiceRecord } from '../repositories/invoice.repository.js';
import { formatAmount } from '../templates/invoice-receipt/format.js';
import { ApiError } from '../utils/api-error.js';
import { fromWhatsAppError, whatsappErrorMessage } from '../utils/whatsapp-error.js';
import * as auditLogService from './audit-log.service.js';
import { INVOICE_NOT_FOUND } from './invoice-pdf.service.js';

const MAX_SEND_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_000;
// Upper bound of one send (each attempt may upload the PDF, then send); a QUEUED status older
// than this was abandoned, e.g. by a crash, and may be retried.
const STALE_SEND_MS = MAX_SEND_ATTEMPTS * (2 * env.WHATSAPP_REQUEST_TIMEOUT_MS) + 60_000;

const GENERIC_FAILURE = 'The invoice could not be sent over WhatsApp; try again';

export interface WhatsappSendOutcome {
  /** The invoice with its saved WhatsApp status: SENT, or FAILED with `whatsappError`. */
  invoice: InvoiceRecord;
  /** Set when sending failed; the failure is already recorded on `invoice`. */
  error?: ApiError;
}

/**
 * The digits-only number to message: `phone` when given, else the recipient's phone on file.
 * Throws a validation error on `phone` when there is none or it is not a valid number.
 */
export function resolveRecipient(invoice: InvoiceRecord, phone?: string): string {
  const raw = phone ?? invoice.recipientPhone;
  if (!raw) {
    throw ApiError.validation([
      {
        path: 'phone',
        message: 'The recipient has no phone number on file; enter one to send over WhatsApp',
      },
    ]);
  }
  try {
    return toWhatsAppNumber(raw);
  } catch (err) {
    if (err instanceof WhatsAppError) throw fromWhatsAppError(err);
    throw err;
  }
}

async function readPdf(key: string): Promise<Buffer> {
  const file = await storage.read(key);
  if (!file) throw ApiError.notFound('Invoice PDF file not found; regenerate the invoice');
  return buffer(file.body);
}

/**
 * Outside the 24-hour customer service window WhatsApp only delivers approved templates, so an
 * invoice template (with a DOCUMENT header) is used when configured. Its body placeholders are
 * `{{1}}` recipient name, `{{2}}` invoice number, `{{3}}` amount.
 */
function sendOnce(to: string, invoice: InvoiceRecord, pdf: Buffer): Promise<WhatsAppSendResult> {
  const fileName = `${invoice.invoiceNumber}.pdf`;
  const document = { kind: 'buffer', content: pdf, mimeType: PDF_CONTENT_TYPE } as const;
  const amount = formatAmount(invoice.amount);

  if (env.WHATSAPP_INVOICE_TEMPLATE_NAME) {
    return whatsapp.sendMessage({
      to,
      message: {
        type: 'template',
        name: env.WHATSAPP_INVOICE_TEMPLATE_NAME,
        languageCode: env.WHATSAPP_INVOICE_TEMPLATE_LANGUAGE,
        bodyParameters: [invoice.recipientName, invoice.invoiceNumber, amount],
        headerDocument: { document, fileName },
      },
    });
  }
  return whatsapp.sendDocument({
    to,
    document,
    fileName,
    caption: `Payment receipt ${invoice.invoiceNumber}\nAmount: ${amount}`,
  });
}

// A timeout is not retried: the provider may have accepted the message, and a retry would
// deliver it twice.
function isRetryable(err: unknown): boolean {
  return err instanceof WhatsAppError && err.retryable && err.code !== WHATSAPP_ERROR_CODES.TIMEOUT;
}

async function sendWithRetry(
  invoiceId: string,
  send: () => Promise<WhatsAppSendResult>,
): Promise<WhatsAppSendResult> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await send();
    } catch (err) {
      if (attempt >= MAX_SEND_ATTEMPTS || !isRetryable(err)) throw err;
      const delayMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      logger.warn({ err, invoiceId, attempt, delayMs }, 'WhatsApp send failed; retrying');
      await sleep(delayMs);
    }
  }
}

function toApiError(err: unknown, invoiceId: string): ApiError {
  if (err instanceof WhatsAppError) return fromWhatsAppError(err, { invoiceId });
  if (err instanceof ApiError) return err;
  return ApiError.serviceUnavailable(GENERIC_FAILURE, { invoiceId }, err);
}

async function recordFailure(
  companyId: string,
  invoiceId: string,
  reason: string,
): Promise<InvoiceRecord> {
  const failed = await invoiceRepository.updateInCompany(companyId, invoiceId, {
    whatsappStatus: INVOICE_WHATSAPP_STATUSES.FAILED,
    whatsappError: reason,
    whatsappStatusAt: new Date(),
  });
  if (!failed) throw ApiError.notFound(INVOICE_NOT_FOUND);
  return failed;
}

function auditSend(
  actor: TenantUserDto,
  invoice: InvoiceRecord,
  metadata: Record<string, unknown>,
): Promise<void> {
  return auditLogService.record(actor, {
    action: AUDIT_ACTIONS.SEND_WHATSAPP,
    entity: AUDIT_ENTITIES.INVOICE,
    entityId: invoice._id.toString(),
    metadata: {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.whatsappStatus,
      ...metadata,
    },
  });
}

/**
 * Sends the invoice's stored PDF to `to` as a WhatsApp document and saves the outcome on the
 * invoice. Provider failures do not throw: they are recorded (`FAILED` + `whatsappError`) and
 * returned as `error`, so callers decide whether the failure fails their request.
 */
export async function sendInvoicePdf(
  actor: TenantUserDto,
  invoice: InvoiceRecord,
  to: string,
): Promise<WhatsappSendOutcome> {
  const { companyId } = actor;
  const id = invoice._id.toString();
  const { pdfKey } = invoice;
  if (!pdfKey) throw ApiError.conflict('The invoice PDF has not been generated yet');

  const staleBefore = new Date(Date.now() - STALE_SEND_MS);
  const claimed = await invoiceRepository.claimWhatsappSend(companyId, id, staleBefore);
  if (!claimed) {
    throw ApiError.conflict('The invoice is already being sent over WhatsApp', { invoiceId: id });
  }

  let result: WhatsAppSendResult;
  try {
    const pdf = await readPdf(pdfKey);
    result = await sendWithRetry(id, () => sendOnce(to, claimed, pdf));
  } catch (err) {
    const error = toApiError(err, id);
    const reason = err instanceof WhatsAppError ? whatsappErrorMessage(err) : error.message;
    logger.warn(
      {
        err,
        invoiceId: id,
        ...(err instanceof WhatsAppError && {
          whatsappCode: err.code,
          httpStatus: err.httpStatus,
          providerCode: err.providerCode,
        }),
      },
      `Invoice WhatsApp send failed: ${reason}`,
    );
    const failed = await recordFailure(companyId, id, reason);
    await auditSend(actor, failed, { recipient: to, error: reason });
    return { invoice: failed, error };
  }

  const now = new Date();
  const sent = await invoiceRepository.updateInCompany(companyId, id, {
    whatsappStatus: INVOICE_WHATSAPP_STATUSES.SENT,
    whatsappMessageId: result.messageId,
    whatsappRecipient: result.recipient,
    whatsappStatusAt: now,
    whatsappError: null,
    sentAt: now,
  });
  if (!sent) throw ApiError.notFound(INVOICE_NOT_FOUND);
  logger.info({ invoiceId: id, messageId: result.messageId }, 'Invoice sent over WhatsApp');
  await auditSend(actor, sent, { recipient: result.recipient, messageId: result.messageId });
  return { invoice: sent };
}

/** First validation message, e.g. "no phone number on file", for recording on the invoice. */
function failureReason(error: ApiError): string {
  if (Array.isArray(error.details)) {
    const [issue] = error.details as unknown[];
    if (
      issue &&
      typeof issue === 'object' &&
      'message' in issue &&
      typeof issue.message === 'string'
    ) {
      return issue.message;
    }
  }
  return error.message;
}

/**
 * Best-effort send to the recipient's phone on file, e.g. right after the invoice is issued.
 * Every expected failure (no phone, provider down, ...) is recorded on the invoice instead of
 * thrown, so the invoice itself is still returned.
 */
export async function sendToRecipientOnFile(
  actor: TenantUserDto,
  invoice: InvoiceRecord,
): Promise<InvoiceRecord> {
  try {
    const to = resolveRecipient(invoice);
    return (await sendInvoicePdf(actor, invoice, to)).invoice;
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
    logger.warn({ err, invoiceId: invoice._id.toString() }, 'Automatic WhatsApp send skipped');
    return recordFailure(actor.companyId, invoice._id.toString(), failureReason(err));
  }
}
