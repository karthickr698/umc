import { Types, type QueryFilter, type UpdateQuery } from 'mongoose';
import type { PaymentMode, PaymentType, WorkerType } from '@umc/shared';
import { PaymentModel, type Payment } from '../models/payment.model.js';
import { dateRangeCondition, toObjectId } from '../utils/aggregation.js';
import {
  createAttachmentRepository,
  deleteReturningAttachments,
} from '../utils/attachment-queries.js';
import type { Attachment } from '../utils/attachment-schema.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import { workerIdField, type WorkerRef } from '../utils/worker-ref.js';

export type PaymentRecord = Payment & { _id: Types.ObjectId };

export interface PaymentFilter {
  siteId?: string;
  workerType?: WorkerType;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  paymentType?: PaymentType;
  paymentMode?: PaymentMode;
  /** Inclusive range of stored calendar days. */
  from?: Date;
  to?: Date;
}

type EditableFields =
  'amount' | 'paymentDate' | 'paymentType' | 'paymentMode' | 'referenceNumber' | 'description';

export type NewPayment = Pick<Payment, EditableFields | 'workerType'> & {
  companyId: string;
  siteId?: string;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  createdBy: string;
};

export type PaymentChanges = Partial<
  Pick<Payment, EditableFields> & {
    /** `null` removes the site. */
    siteId: string | null;
    employeeId: string;
    contractorId: string;
    contractorEmployeeId: string;
  }
>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(PaymentModel, id);
}

export function findByIdInCompany(companyId: string, id: string): Promise<PaymentRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return PaymentModel.findOne({ _id: id, companyId }).lean<PaymentRecord>().exec();
}

export async function existsForSite(companyId: string, siteId: string): Promise<boolean> {
  return Boolean(await PaymentModel.exists({ companyId, siteId }).exec());
}

export async function existsForWorker(companyId: string, worker: WorkerRef): Promise<boolean> {
  const query = { companyId, [workerIdField(worker.workerType)]: worker.workerId };
  return Boolean(await PaymentModel.exists(query).exec());
}

/** Ids are ObjectIds so the same filter also works as an aggregation `$match`. */
export function toPaymentQuery(companyId: string, filter: PaymentFilter): QueryFilter<Payment> {
  const { siteId, workerType, employeeId, contractorId, contractorEmployeeId } = filter;
  const query: QueryFilter<Payment> = { companyId: toObjectId(companyId) };
  if (siteId) query.siteId = toObjectId(siteId);
  if (workerType) query.workerType = workerType;
  if (employeeId) query.employeeId = toObjectId(employeeId);
  if (contractorId) query.contractorId = toObjectId(contractorId);
  if (contractorEmployeeId) query.contractorEmployeeId = toObjectId(contractorEmployeeId);
  if (filter.paymentType) query.paymentType = filter.paymentType;
  if (filter.paymentMode) query.paymentMode = filter.paymentMode;
  const paymentDate = dateRangeCondition(filter.from, filter.to);
  if (paymentDate) query.paymentDate = paymentDate;
  return query;
}

/** Newest payment day first; within a day, most recently recorded first. */
export const PAYMENT_LIST_SORT = { paymentDate: -1, createdAt: -1, _id: -1 } as const;

export async function listByCompany(
  companyId: string,
  filter: PaymentFilter,
  page: SkipLimit,
): Promise<{ items: PaymentRecord[]; total: number }> {
  const query = toPaymentQuery(companyId, filter);
  const [items, total] = await Promise.all([
    PaymentModel.find(query)
      .sort(PAYMENT_LIST_SORT)
      .skip(page.skip)
      .limit(page.limit)
      .lean<PaymentRecord[]>()
      .exec(),
    PaymentModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(payment: NewPayment): Promise<PaymentRecord> {
  const doc = await PaymentModel.create(payment);
  return doc.toObject<PaymentRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: PaymentChanges,
): Promise<PaymentRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  const { siteId, ...fields } = changes;
  const update: UpdateQuery<Payment> = { $set: fields };
  if (siteId === null) update.$unset = { siteId: 1 };
  else if (siteId !== undefined) update.$set = { ...fields, siteId };
  return PaymentModel.findOneAndUpdate({ _id: id, companyId }, update, {
    returnDocument: 'after',
    runValidators: true,
  })
    .lean<PaymentRecord>()
    .exec();
}

/** Resolves to the deleted payment's attachments, or `null` when nothing was deleted. */
export function deleteInCompany(companyId: string, id: string): Promise<Attachment[] | null> {
  return deleteReturningAttachments(PaymentModel, companyId, id);
}

export const attachments = createAttachmentRepository(PaymentModel);
