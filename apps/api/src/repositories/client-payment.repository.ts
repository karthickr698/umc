import { Types, type QueryFilter, type UpdateQuery } from 'mongoose';
import type { PaymentMode } from '@umc/shared';
import { ClientPaymentModel, type ClientPayment } from '../models/client-payment.model.js';
import {
  createAttachmentRepository,
  deleteReturningAttachments,
} from '../utils/attachment-queries.js';
import type { Attachment } from '../utils/attachment-schema.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';

export type ClientPaymentRecord = ClientPayment & { _id: Types.ObjectId };

export interface ClientPaymentFilter {
  clientId?: string;
  siteId?: string;
  paymentMode?: PaymentMode;
  /** Inclusive range of stored calendar days. */
  from?: Date;
  to?: Date;
}

type EditableFields = 'amount' | 'receivedDate' | 'paymentMode' | 'referenceNumber' | 'description';

export type NewClientPayment = Pick<ClientPayment, EditableFields> & {
  companyId: string;
  clientId: string;
  siteId?: string;
  createdBy: string;
};

export type ClientPaymentChanges = Partial<
  Pick<ClientPayment, EditableFields> & {
    clientId: string;
    /** `null` removes the site. */
    siteId: string | null;
  }
>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(ClientPaymentModel, id);
}

export function findByIdInCompany(
  companyId: string,
  id: string,
): Promise<ClientPaymentRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ClientPaymentModel.findOne({ _id: id, companyId }).lean<ClientPaymentRecord>().exec();
}

export async function existsForClient(companyId: string, clientId: string): Promise<boolean> {
  return Boolean(await ClientPaymentModel.exists({ companyId, clientId }).exec());
}

export async function existsForSite(companyId: string, siteId: string): Promise<boolean> {
  return Boolean(await ClientPaymentModel.exists({ companyId, siteId }).exec());
}

/** Whether the site has receipts recorded against any client other than `clientId`. */
export async function existsForSiteFromOtherClient(
  companyId: string,
  siteId: string,
  clientId: string,
): Promise<boolean> {
  return Boolean(
    await ClientPaymentModel.exists({ companyId, siteId, clientId: { $ne: clientId } }).exec(),
  );
}

function toQuery(companyId: string, filter: ClientPaymentFilter): QueryFilter<ClientPayment> {
  const { clientId, siteId, paymentMode, from, to } = filter;
  const query: QueryFilter<ClientPayment> = { companyId };
  if (clientId) query.clientId = clientId;
  if (siteId) query.siteId = siteId;
  if (paymentMode) query.paymentMode = paymentMode;
  if (from || to) {
    query.receivedDate = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    };
  }
  return query;
}

/** Newest receipt day first; within a day, most recently recorded first. */
export async function listByCompany(
  companyId: string,
  filter: ClientPaymentFilter,
  page: SkipLimit,
): Promise<{ items: ClientPaymentRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    ClientPaymentModel.find(query)
      .sort({ receivedDate: -1, createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<ClientPaymentRecord[]>()
      .exec(),
    ClientPaymentModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(payment: NewClientPayment): Promise<ClientPaymentRecord> {
  const doc = await ClientPaymentModel.create(payment);
  return doc.toObject<ClientPaymentRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: ClientPaymentChanges,
): Promise<ClientPaymentRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  const { siteId, ...fields } = changes;
  const update: UpdateQuery<ClientPayment> = { $set: fields };
  if (siteId === null) update.$unset = { siteId: 1 };
  else if (siteId !== undefined) update.$set = { ...fields, siteId };
  return ClientPaymentModel.findOneAndUpdate({ _id: id, companyId }, update, {
    returnDocument: 'after',
    runValidators: true,
  })
    .lean<ClientPaymentRecord>()
    .exec();
}

/** Resolves to the deleted receipt's attachments, or `null` when nothing was deleted. */
export function deleteInCompany(companyId: string, id: string): Promise<Attachment[] | null> {
  return deleteReturningAttachments(ClientPaymentModel, companyId, id);
}

export const attachments = createAttachmentRepository(ClientPaymentModel);
