import { Types, type QueryFilter, type UpdateQuery } from 'mongoose';
import {
  INVOICE_WHATSAPP_STATUSES,
  type InvoiceRecipientType,
  type InvoiceStatus,
  type InvoiceWhatsappStatus,
} from '@umc/shared';
import { InvoiceModel, type Invoice } from '../models/invoice.model.js';
import { dateRangeCondition } from '../utils/aggregation.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import { containsInsensitive } from '../utils/regex.js';

export type InvoiceRecord = Invoice & { _id: Types.ObjectId };

export interface InvoiceFilter {
  paymentId?: string;
  siteId?: string;
  status?: InvoiceStatus;
  recipientType?: InvoiceRecipientType;
  search?: string;
  /** Inclusive range of stored calendar days. */
  from?: Date;
  to?: Date;
}

/** Fields captured from the payment and its worker each time the PDF is rendered. */
type SnapshotFields =
  | 'recipientType'
  | 'recipientName'
  | 'recipientPhone'
  | 'amount'
  | 'invoiceDate'
  | 'workPeriod'
  | 'workDetails'
  | 'notes';

export type NewInvoice = Pick<Invoice, SnapshotFields | 'invoiceNumber'> & {
  companyId: string;
  paymentId: string;
  siteId?: string;
  createdBy: string;
};

type ChangeableFields =
  | SnapshotFields
  | 'siteId'
  | 'status'
  | 'pdfKey'
  | 'generatedAt'
  | 'whatsappStatus'
  | 'whatsappMessageId'
  | 'whatsappRecipient'
  | 'whatsappError'
  | 'whatsappStatusAt'
  | 'sentAt';

/** `undefined` leaves a field unchanged; `null` removes an optional field. */
export type InvoiceChanges = {
  [K in ChangeableFields]?: K extends 'siteId'
    ? string | null
    : undefined extends Invoice[K]
      ? Invoice[K] | null
      : Invoice[K];
};

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(InvoiceModel, id);
}

export function findByIdInCompany(companyId: string, id: string): Promise<InvoiceRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return InvoiceModel.findOne({ _id: id, companyId }).lean<InvoiceRecord>().exec();
}

export function findByPaymentInCompany(
  companyId: string,
  paymentId: string,
): Promise<InvoiceRecord | null> {
  return InvoiceModel.findOne({ companyId, paymentId }).lean<InvoiceRecord>().exec();
}

function toQuery(companyId: string, filter: InvoiceFilter): QueryFilter<Invoice> {
  const query: QueryFilter<Invoice> = { companyId };
  if (filter.paymentId) query.paymentId = filter.paymentId;
  if (filter.siteId) query.siteId = filter.siteId;
  if (filter.status) query.status = filter.status;
  if (filter.recipientType) query.recipientType = filter.recipientType;
  if (filter.search) {
    const pattern = containsInsensitive(filter.search);
    query.$or = [{ invoiceNumber: pattern }, { recipientName: pattern }];
  }
  const invoiceDate = dateRangeCondition(filter.from, filter.to);
  if (invoiceDate) query.invoiceDate = invoiceDate;
  return query;
}

/** Newest invoice day first; within a day, most recently issued first. */
export async function listByCompany(
  companyId: string,
  filter: InvoiceFilter,
  page: SkipLimit,
): Promise<{ items: InvoiceRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    InvoiceModel.find(query)
      .sort({ invoiceDate: -1, createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<InvoiceRecord[]>()
      .exec(),
    InvoiceModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(invoice: NewInvoice): Promise<InvoiceRecord> {
  const doc = await InvoiceModel.create(invoice);
  return doc.toObject<InvoiceRecord>();
}

function toUpdate(changes: InvoiceChanges): UpdateQuery<Invoice> {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};
  for (const [field, value] of Object.entries(changes)) {
    if (value === null) $unset[field] = 1;
    else if (value !== undefined) $set[field] = value;
  }
  return { $set, ...(Object.keys($unset).length > 0 && { $unset }) };
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: InvoiceChanges,
): Promise<InvoiceRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return InvoiceModel.findOneAndUpdate({ _id: id, companyId }, toUpdate(changes), {
    returnDocument: 'after',
    runValidators: true,
  })
    .lean<InvoiceRecord>()
    .exec();
}

/**
 * Atomically marks the invoice QUEUED for a WhatsApp send. Resolves to `null` when it does not
 * exist or another send is in progress; a QUEUED status older than `staleBefore` is treated as
 * abandoned (e.g. the process died mid-send) and may be claimed again.
 */
export function claimWhatsappSend(
  companyId: string,
  id: string,
  staleBefore: Date,
): Promise<InvoiceRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  const { QUEUED } = INVOICE_WHATSAPP_STATUSES;
  return InvoiceModel.findOneAndUpdate(
    {
      _id: id,
      companyId,
      $or: [
        { whatsappStatus: { $ne: QUEUED } },
        { whatsappStatusAt: { $exists: false } },
        { whatsappStatusAt: { $lt: staleBefore } },
      ],
    },
    {
      $set: { whatsappStatus: QUEUED, whatsappStatusAt: new Date() },
      // Late webhooks for the previous message must not update this send.
      $unset: { whatsappError: 1, whatsappMessageId: 1 },
    },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<InvoiceRecord>()
    .exec();
}

export interface WhatsappDeliveryUpdate {
  messageId: string;
  status: InvoiceWhatsappStatus;
  at: Date;
  /** Only applied when the invoice's current status is one of these. */
  fromStatuses: readonly InvoiceWhatsappStatus[];
  error?: string;
}

/** Applies a provider delivery report to the invoice that sent `messageId`; `false` if none matched. */
export async function applyWhatsappDelivery({
  messageId,
  status,
  at,
  fromStatuses,
  error,
}: WhatsappDeliveryUpdate): Promise<boolean> {
  const result = await InvoiceModel.updateOne(
    { whatsappMessageId: messageId, whatsappStatus: { $in: fromStatuses } },
    toUpdate({ whatsappStatus: status, whatsappStatusAt: at, whatsappError: error ?? null }),
    { runValidators: true },
  ).exec();
  return result.modifiedCount > 0;
}

/** Resolves to the PDF keys of the deleted invoices. */
export async function deleteByPayment(companyId: string, paymentId: string): Promise<string[]> {
  const invoices = await InvoiceModel.find({ companyId, paymentId })
    .select('pdfKey')
    .lean<Pick<InvoiceRecord, '_id' | 'pdfKey'>[]>()
    .exec();
  if (invoices.length === 0) return [];
  await InvoiceModel.deleteMany({ _id: { $in: invoices.map(({ _id }) => _id) } }).exec();
  return invoices.flatMap(({ pdfKey }) => (pdfKey ? [pdfKey] : []));
}
