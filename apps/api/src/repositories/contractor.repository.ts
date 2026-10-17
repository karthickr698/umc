import { Types, type QueryFilter } from 'mongoose';
import type { ContractorCategory, ContractorStatus } from '@umc/shared';
import { ContractorModel, type Contractor } from '../models/contractor.model.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import { containsInsensitive } from '../utils/regex.js';
import type { DbSession } from '../utils/transaction.js';

export type ContractorRecord = Contractor & { _id: Types.ObjectId };

export interface ContractorFilter {
  status?: ContractorStatus;
  category?: ContractorCategory;
  search?: string;
}

type EditableFields = 'name' | 'phone' | 'email' | 'category' | 'address' | 'notes';

export type NewContractor = Pick<Contractor, EditableFields> & {
  companyId: string;
  status?: ContractorStatus;
};

export type ContractorChanges = Partial<Pick<Contractor, EditableFields | 'status'>>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(ContractorModel, id);
}

export function findByIdInCompany(companyId: string, id: string): Promise<ContractorRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ContractorModel.findOne({ _id: id, companyId }).lean<ContractorRecord>().exec();
}

export async function existsInCompany(companyId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  return Boolean(await ContractorModel.exists({ _id: id, companyId }).exec());
}

/** The subset of `ids` naming contractors in the company. */
export async function findExistingIdsInCompany(
  companyId: string,
  ids: readonly string[],
  session?: DbSession,
): Promise<string[]> {
  const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
  const found = await ContractorModel.find({ _id: { $in: validIds }, companyId }, { _id: 1 })
    .session(session ?? null)
    .lean<{ _id: Types.ObjectId }[]>()
    .exec();
  return found.map(({ _id }) => _id.toString());
}

function toQuery(
  companyId: string,
  { status, category, search }: ContractorFilter,
): QueryFilter<Contractor> {
  const query: QueryFilter<Contractor> = { companyId };
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    const pattern = containsInsensitive(search);
    query.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }
  return query;
}

export async function listByCompany(
  companyId: string,
  filter: ContractorFilter,
  page: SkipLimit,
): Promise<{ items: ContractorRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    ContractorModel.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<ContractorRecord[]>()
      .exec(),
    ContractorModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(contractor: NewContractor): Promise<ContractorRecord> {
  const doc = await ContractorModel.create(contractor);
  return doc.toObject<ContractorRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: ContractorChanges,
): Promise<ContractorRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ContractorModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<ContractorRecord>()
    .exec();
}

/** Resolves to `true` when a contractor was deleted. */
export async function deleteInCompany(companyId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const { deletedCount } = await ContractorModel.deleteOne({ _id: id, companyId }).exec();
  return deletedCount > 0;
}
