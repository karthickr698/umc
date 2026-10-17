import { Types, type QueryFilter } from 'mongoose';
import type { ClientStatus } from '@umc/shared';
import { ClientModel, type Client } from '../models/client.model.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import { containsInsensitive } from '../utils/regex.js';

export type ClientRecord = Client & { _id: Types.ObjectId };

export interface ClientFilter {
  status?: ClientStatus;
  search?: string;
}

export type NewClient = Pick<Client, 'name' | 'phone' | 'email' | 'address'> & {
  companyId: string;
  status?: ClientStatus;
};

export type ClientChanges = Partial<
  Pick<Client, 'name' | 'phone' | 'email' | 'address' | 'status'>
>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(ClientModel, id);
}

export function findByIdInCompany(companyId: string, id: string): Promise<ClientRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ClientModel.findOne({ _id: id, companyId }).lean<ClientRecord>().exec();
}

/** Cross-company name lookup for SUPER_ADMIN listings. */
export async function findNamesByIds(ids: readonly string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await ClientModel.find({ _id: { $in: ids } })
    .select('name')
    .lean<Pick<ClientRecord, '_id' | 'name'>[]>()
    .exec();
  return new Map(rows.map((row) => [row._id.toString(), row.name]));
}

export async function existsInCompany(companyId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  return Boolean(await ClientModel.exists({ _id: id, companyId }).exec());
}

function toQuery(companyId: string, { status, search }: ClientFilter): QueryFilter<Client> {
  const query: QueryFilter<Client> = { companyId };
  if (status) query.status = status;
  if (search) {
    const pattern = containsInsensitive(search);
    query.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }
  return query;
}

export async function listByCompany(
  companyId: string,
  filter: ClientFilter,
  page: SkipLimit,
): Promise<{ items: ClientRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    ClientModel.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<ClientRecord[]>()
      .exec(),
    ClientModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(client: NewClient): Promise<ClientRecord> {
  const doc = await ClientModel.create(client);
  return doc.toObject<ClientRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: ClientChanges,
): Promise<ClientRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ClientModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<ClientRecord>()
    .exec();
}

/** Resolves to `true` when a client was deleted. */
export async function deleteInCompany(companyId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const { deletedCount } = await ClientModel.deleteOne({ _id: id, companyId }).exec();
  return deletedCount > 0;
}
