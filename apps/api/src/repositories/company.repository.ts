import { Types, type QueryFilter } from 'mongoose';
import type { CompanyStatus } from '@umc/shared';
import { CompanyModel, type Company } from '../models/company.model.js';
import type { SkipLimit } from '../utils/pagination.js';
import { containsInsensitive } from '../utils/regex.js';
import type { DbSession } from '../utils/transaction.js';

export type CompanyRecord = Company & { _id: Types.ObjectId };

export type NewCompany = Pick<Company, 'name' | 'phone' | 'email'>;

export interface CompanyFilter {
  status?: CompanyStatus;
  search?: string;
}

export async function create(company: NewCompany, session?: DbSession): Promise<CompanyRecord> {
  const [doc] = await CompanyModel.create([company], { session: session ?? null });
  if (!doc) throw new Error('Company insert returned no document');
  return doc.toObject<CompanyRecord>();
}

export function findById(id: string): Promise<CompanyRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return CompanyModel.findById(id).lean<CompanyRecord>().exec();
}

export async function findNamesByIds(ids: readonly string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await CompanyModel.find({ _id: { $in: ids } })
    .select('name')
    .lean<Pick<CompanyRecord, '_id' | 'name'>[]>()
    .exec();
  return new Map(rows.map((row) => [row._id.toString(), row.name]));
}

function toQuery({ status, search }: CompanyFilter): QueryFilter<Company> {
  const query: QueryFilter<Company> = {};
  if (status) query.status = status;
  if (search) query.name = containsInsensitive(search);
  return query;
}

/** Every company on the platform, newest first. */
export async function list(
  filter: CompanyFilter,
  page: SkipLimit,
): Promise<{ items: CompanyRecord[]; total: number }> {
  const query = toQuery(filter);
  const [items, total] = await Promise.all([
    CompanyModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<CompanyRecord[]>()
      .exec(),
    CompanyModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}
