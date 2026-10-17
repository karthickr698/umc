import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  INVOICE_NUMBER_FORMAT,
  INVOICE_STATUSES,
  type InvoiceDto,
  type Paginated,
  type TenantUserDto,
} from '@umc/shared';
import * as counterRepository from '../repositories/counter.repository.js';
import * as invoiceRepository from '../repositories/invoice.repository.js';
import type { InvoiceChanges, InvoiceRecord } from '../repositories/invoice.repository.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { fromCalendarDate, toCalendarDate } from '../utils/calendar-date.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateInvoiceInput,
  ListInvoicesInput,
  RegenerateInvoiceInput,
  SendInvoiceWhatsappInput,
  WorkPeriodInput,
} from '../validators/invoice.validator.js';
import * as auditLogService from './audit-log.service.js';
import { loadInvoiceContext, recipientSnapshot } from './invoice-document.service.js';
import { INVOICE_NOT_FOUND, generatePdf } from './invoice-pdf.service.js';
import {
  resolveRecipient,
  sendInvoicePdf,
  sendToRecipientOnFile,
} from './invoice-whatsapp.service.js';

export function toInvoiceDto(invoice: InvoiceRecord): InvoiceDto {
  return {
    id: invoice._id.toString(),
    companyId: invoice.companyId.toString(),
    invoiceNumber: invoice.invoiceNumber,
    paymentId: invoice.paymentId.toString(),
    recipientType: invoice.recipientType,
    recipientName: invoice.recipientName,
    ...(invoice.recipientPhone !== undefined && { recipientPhone: invoice.recipientPhone }),
    ...(invoice.siteId && { siteId: invoice.siteId.toString() }),
    amount: invoice.amount,
    invoiceDate: toCalendarDate(invoice.invoiceDate),
    ...(invoice.workPeriod && {
      workPeriod: {
        from: toCalendarDate(invoice.workPeriod.from),
        to: toCalendarDate(invoice.workPeriod.to),
      },
    }),
    ...(invoice.workDetails !== undefined && { workDetails: invoice.workDetails }),
    ...(invoice.notes !== undefined && { notes: invoice.notes }),
    status: invoice.status,
    whatsappStatus: invoice.whatsappStatus,
    ...(invoice.whatsappRecipient && { whatsappRecipient: invoice.whatsappRecipient }),
    ...(invoice.whatsappError && { whatsappError: invoice.whatsappError }),
    ...(invoice.whatsappStatusAt && {
      whatsappStatusAt: invoice.whatsappStatusAt.toISOString(),
    }),
    ...(invoice.sentAt && { sentAt: invoice.sentAt.toISOString() }),
    ...(invoice.generatedAt && { generatedAt: invoice.generatedAt.toISOString() }),
    createdBy: invoice.createdBy.toString(),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

/** Owning company of an invoice, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return invoiceRepository.findCompanyIdById(id);
}

/** `INV-2026-00042`: numbered per company and per year of the invoice date. */
async function nextInvoiceNumber(companyId: string, invoiceDate: Date): Promise<string> {
  const year = invoiceDate.getUTCFullYear();
  const seq = await counterRepository.next(companyId, `invoice:${year}`);
  const { prefix, sequenceDigits } = INVOICE_NUMBER_FORMAT;
  return `${prefix}-${year}-${String(seq).padStart(sequenceDigits, '0')}`;
}

function toWorkPeriod({ from, to }: WorkPeriodInput) {
  return { from: fromCalendarDate(from), to: fromCalendarDate(to) };
}

export async function list(
  actor: TenantUserDto,
  { page, pageSize, from, to, ...filter }: ListInvoicesInput,
): Promise<Paginated<InvoiceDto>> {
  const { items, total } = await invoiceRepository.listByCompany(
    actor.companyId,
    {
      ...filter,
      ...(from !== undefined && { from: fromCalendarDate(from) }),
      ...(to !== undefined && { to: fromCalendarDate(to) }),
    },
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(items.map(toInvoiceDto), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<InvoiceDto> {
  const invoice = await invoiceRepository.findByIdInCompany(actor.companyId, id);
  if (!invoice) throw ApiError.notFound(INVOICE_NOT_FOUND);
  return toInvoiceDto(invoice);
}

/** Issues the invoice of a payment (one per payment) and renders its PDF. */
export async function create(actor: TenantUserDto, input: CreateInvoiceInput): Promise<InvoiceDto> {
  const { companyId } = actor;
  const payment = await paymentRepository.findByIdInCompany(companyId, input.paymentId);
  if (!payment) throw ApiError.validation([{ path: 'paymentId', message: 'Payment not found' }]);

  const existing = await invoiceRepository.findByPaymentInCompany(companyId, input.paymentId);
  if (existing) {
    throw ApiError.conflict('This payment already has an invoice; regenerate it instead', {
      invoiceId: existing._id.toString(),
    });
  }

  const context = await loadInvoiceContext(companyId, payment);
  const { recipientPhone, ...recipient } = recipientSnapshot(context);
  const invoiceDate =
    input.invoiceDate !== undefined ? fromCalendarDate(input.invoiceDate) : payment.paymentDate;
  const workDetails = input.workDetails || payment.description;

  const invoice = await invoiceRepository.create({
    companyId,
    paymentId: input.paymentId,
    invoiceNumber: await nextInvoiceNumber(companyId, invoiceDate),
    ...recipient,
    ...(recipientPhone && { recipientPhone }),
    ...(payment.siteId && { siteId: payment.siteId.toString() }),
    amount: payment.amount,
    invoiceDate,
    ...(input.workPeriod && { workPeriod: toWorkPeriod(input.workPeriod) }),
    ...(workDetails && { workDetails }),
    ...(input.notes && { notes: input.notes }),
    createdBy: actor.id,
  });
  const generated = await generatePdf(companyId, invoice, payment, context);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.INVOICE,
    entityId: generated._id.toString(),
    metadata: {
      invoiceNumber: generated.invoiceNumber,
      paymentId: input.paymentId,
      recipientType: generated.recipientType,
      amount: generated.amount,
      invoiceDate: toCalendarDate(generated.invoiceDate),
      status: generated.status,
    },
  });
  return toInvoiceDto(
    input.sendWhatsapp ? await sendToRecipientOnFile(actor, generated) : generated,
  );
}

/**
 * Re-renders the PDF from the payment's current data (amount, worker, site), keeping the invoice
 * number. Also retries invoices whose generation FAILED.
 */
export async function regenerate(
  actor: TenantUserDto,
  id: string,
  input: RegenerateInvoiceInput,
): Promise<InvoiceDto> {
  return toInvoiceDto(await regenerateRecord(actor.companyId, id, input));
}

/**
 * Sends the PDF over WhatsApp (re-rendering it first when it is missing or FAILED) and saves the
 * message status. A failed send is recorded on the invoice, then reported as the error.
 */
export async function sendWhatsapp(
  actor: TenantUserDto,
  id: string,
  input: SendInvoiceWhatsappInput,
): Promise<InvoiceDto> {
  const { companyId } = actor;
  const invoice = await invoiceRepository.findByIdInCompany(companyId, id);
  if (!invoice) throw ApiError.notFound(INVOICE_NOT_FOUND);
  const to = resolveRecipient(invoice, input.phone);

  const ready =
    invoice.status === INVOICE_STATUSES.GENERATED && invoice.pdfKey
      ? invoice
      : await regenerateRecord(companyId, id, {});
  const { invoice: updated, error } = await sendInvoicePdf(actor, ready, to);
  if (error) throw error;
  return toInvoiceDto(updated);
}

async function regenerateRecord(
  companyId: string,
  id: string,
  input: RegenerateInvoiceInput,
): Promise<InvoiceRecord> {
  const invoice = await invoiceRepository.findByIdInCompany(companyId, id);
  if (!invoice) throw ApiError.notFound(INVOICE_NOT_FOUND);
  const payment = await paymentRepository.findByIdInCompany(
    companyId,
    invoice.paymentId.toString(),
  );
  if (!payment) throw ApiError.conflict("The invoice's payment no longer exists");

  const context = await loadInvoiceContext(companyId, payment);
  const { recipientPhone, ...recipient } = recipientSnapshot(context);
  const changes: InvoiceChanges = {
    ...recipient,
    recipientPhone: recipientPhone ?? null,
    siteId: payment.siteId?.toString() ?? null,
    amount: payment.amount,
    status: INVOICE_STATUSES.PENDING,
  };
  if (input.invoiceDate !== undefined) changes.invoiceDate = fromCalendarDate(input.invoiceDate);
  if (input.workPeriod !== undefined) {
    changes.workPeriod = input.workPeriod && toWorkPeriod(input.workPeriod);
  }
  if (input.workDetails !== undefined) changes.workDetails = input.workDetails || null;
  if (input.notes !== undefined) changes.notes = input.notes || null;

  const pending = await invoiceRepository.updateInCompany(companyId, id, changes);
  if (!pending) throw ApiError.notFound(INVOICE_NOT_FOUND);
  return generatePdf(companyId, pending, payment, context);
}
