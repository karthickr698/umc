import { Types, type QueryFilter } from 'mongoose';
import type { SiteStatus } from '@umc/shared';
import { SiteModel, type Site } from '../models/site.model.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import { containsInsensitive } from '../utils/regex.js';
import type { DbSession } from '../utils/transaction.js';

export type SiteRecord = Site & { _id: Types.ObjectId };

export interface SiteFilter {
  status?: SiteStatus;
  clientId?: string;
  search?: string;
}

export type NewSite = Pick<Site, 'name' | 'code' | 'address' | 'startDate'> & {
  companyId: string;
  clientId: string;
  status?: SiteStatus;
};

export type SiteChanges = Partial<
  Pick<Site, 'name' | 'code' | 'address' | 'status' | 'startDate'> & { clientId: string }
>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(SiteModel, id);
}

export function findByIdInCompany(companyId: string, id: string): Promise<SiteRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return SiteModel.findOne({ _id: id, companyId }).lean<SiteRecord>().exec();
}

/** Site names by id; ids not in the company are absent. */
export async function findNamesByIdsInCompany(
  companyId: string,
  ids: readonly string[],
): Promise<Map<string, string>> {
  const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
  if (validIds.length === 0) return new Map();
  const rows = await SiteModel.find({ companyId, _id: { $in: validIds } })
    .select('name')
    .lean<Pick<SiteRecord, '_id' | 'name'>[]>()
    .exec();
  return new Map(rows.map((row) => [row._id.toString(), row.name]));
}

export async function existsInCompany(
  companyId: string,
  id: string,
  session?: DbSession,
): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  return Boolean(
    await SiteModel.exists({ _id: id, companyId })
      .session(session ?? null)
      .exec(),
  );
}

/** Codes are compared upper-cased, matching how the model stores them. */
export async function existsByCode(
  companyId: string,
  code: string,
  excludeId?: string,
): Promise<boolean> {
  const query: QueryFilter<Site> = { companyId, code: code.trim().toUpperCase() };
  if (excludeId !== undefined) query._id = { $ne: excludeId };
  return Boolean(await SiteModel.exists(query).exec());
}

export async function existsForClient(companyId: string, clientId: string): Promise<boolean> {
  return Boolean(await SiteModel.exists({ companyId, clientId }).exec());
}

export async function findIdsByClient(companyId: string, clientId: string): Promise<string[]> {
  const ids = await SiteModel.find({ companyId, clientId })
    .distinct<'_id', Types.ObjectId>('_id')
    .exec();
  return ids.map((id) => id.toString());
}

function toQuery(companyId: string, filter: SiteFilter): QueryFilter<Site> {
  return { ...toFilterQuery(filter), companyId };
}

function toFilterQuery({ status, clientId, search }: SiteFilter): QueryFilter<Site> {
  const query: QueryFilter<Site> = {};
  if (status) query.status = status;
  if (clientId) query.clientId = clientId;
  if (search) {
    const pattern = containsInsensitive(search);
    query.$or = [{ name: pattern }, { code: pattern }];
  }
  return query;
}

export async function listByCompany(
  companyId: string,
  filter: SiteFilter,
  page: SkipLimit,
): Promise<{ items: SiteRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    SiteModel.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<SiteRecord[]>()
      .exec(),
    SiteModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

/** Cross-company lookup for SUPER_ADMIN; company-scoped code must use `findByIdInCompany`. */
export function findAnyById(id: string): Promise<SiteRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return SiteModel.findById(id).lean<SiteRecord>().exec();
}

export interface AnySiteFilter extends Omit<SiteFilter, 'clientId'> {
  companyId?: string;
}

/** Sites across every company for SUPER_ADMIN, optionally narrowed to one company. */
export async function listAll(
  { companyId, ...filter }: AnySiteFilter,
  page: SkipLimit,
): Promise<{ items: SiteRecord[]; total: number }> {
  const query = toFilterQuery(filter);
  if (companyId) query.companyId = companyId;
  const [items, total] = await Promise.all([
    SiteModel.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<SiteRecord[]>()
      .exec(),
    SiteModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

/** Number of sites per company id; companies without sites are absent. */
export async function countByCompanyIds(
  companyIds: readonly string[],
): Promise<Map<string, number>> {
  if (companyIds.length === 0) return new Map();
  const rows = await SiteModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { companyId: { $in: companyIds.map((id) => new Types.ObjectId(id)) } } },
    { $group: { _id: '$companyId', count: { $sum: 1 } } },
  ]).exec();
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

export async function create(site: NewSite): Promise<SiteRecord> {
  const doc = await SiteModel.create(site);
  return doc.toObject<SiteRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: SiteChanges,
): Promise<SiteRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return SiteModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<SiteRecord>()
    .exec();
}

/** Resolves to `true` when a site was deleted. */
export async function deleteInCompany(companyId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const { deletedCount } = await SiteModel.deleteOne({ _id: id, companyId }).exec();
  return deletedCount > 0;
}
