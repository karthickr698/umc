import { Types, type QueryFilter } from 'mongoose';
import type { ExpenseCategory } from '@umc/shared';
import { ExpenseModel, type Expense } from '../models/expense.model.js';
import {
  createAttachmentRepository,
  deleteReturningAttachments,
} from '../utils/attachment-queries.js';
import type { Attachment } from '../utils/attachment-schema.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';

export type ExpenseRecord = Expense & { _id: Types.ObjectId };

export interface ExpenseFilter {
  siteId?: string;
  category?: ExpenseCategory;
  /** Inclusive range of stored calendar days. */
  from?: Date;
  to?: Date;
}

type EditableFields =
  'category' | 'vendorName' | 'amount' | 'expenseDate' | 'paymentMode' | 'description';

export type NewExpense = Pick<Expense, EditableFields> & {
  companyId: string;
  siteId: string;
  createdBy: string;
};

export type ExpenseChanges = Partial<Pick<Expense, EditableFields> & { siteId: string }>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(ExpenseModel, id);
}

export function findByIdInCompany(companyId: string, id: string): Promise<ExpenseRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ExpenseModel.findOne({ _id: id, companyId }).lean<ExpenseRecord>().exec();
}

export async function existsForSite(companyId: string, siteId: string): Promise<boolean> {
  return Boolean(await ExpenseModel.exists({ companyId, siteId }).exec());
}

function toQuery(
  companyId: string,
  { siteId, category, from, to }: ExpenseFilter,
): QueryFilter<Expense> {
  const query: QueryFilter<Expense> = { companyId };
  if (siteId) query.siteId = siteId;
  if (category) query.category = category;
  if (from || to) {
    query.expenseDate = {
      ...(from && { $gte: from }),
      ...(to && { $lte: to }),
    };
  }
  return query;
}

/** Newest expense day first; within a day, most recently recorded first. */
export async function listByCompany(
  companyId: string,
  filter: ExpenseFilter,
  page: SkipLimit,
): Promise<{ items: ExpenseRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    ExpenseModel.find(query)
      .sort({ expenseDate: -1, createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<ExpenseRecord[]>()
      .exec(),
    ExpenseModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(expense: NewExpense): Promise<ExpenseRecord> {
  const doc = await ExpenseModel.create(expense);
  return doc.toObject<ExpenseRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: ExpenseChanges,
): Promise<ExpenseRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ExpenseModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<ExpenseRecord>()
    .exec();
}

/** Resolves to the deleted expense's attachments, or `null` when nothing was deleted. */
export function deleteInCompany(companyId: string, id: string): Promise<Attachment[] | null> {
  return deleteReturningAttachments(ExpenseModel, companyId, id);
}

export const attachments = createAttachmentRepository(ExpenseModel);
