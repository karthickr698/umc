import { Types } from 'mongoose';
import { USER_ROLES, type TenantUserRole, type UserRole, type UserStatus } from '@umc/shared';
import { UserModel, type User } from '../models/user.model.js';
import type { SkipLimit } from '../utils/pagination.js';
import type { DbSession } from '../utils/transaction.js';

export type UserRecord = User & { _id: Types.ObjectId };
export type UserWithPassword = UserRecord & { passwordHash: string };

export interface UserFilter {
  role?: UserRole;
  status?: UserStatus;
}

export type NewUser = Pick<User, 'name' | 'email' | 'phone' | 'passwordHash'> & {
  companyId: string;
  role: TenantUserRole;
};

export type NewSuperAdmin = Pick<User, 'name' | 'email' | 'phone' | 'passwordHash'>;

export type UserChanges = Partial<
  Pick<User, 'name' | 'phone' | 'status'> & { role: TenantUserRole }
>;

export function findById(id: string): Promise<UserRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return UserModel.findById(id).lean<UserRecord>().exec();
}

export function findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
  return UserModel.findOne({ email: email.trim().toLowerCase() })
    .select('+passwordHash')
    .lean<UserWithPassword>()
    .exec();
}

/** `null` when the user does not exist or belongs to no company (SUPER_ADMIN). */
export async function findCompanyIdById(id: string): Promise<string | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const user = await UserModel.findById(id)
    .select('companyId')
    .lean<Pick<User, 'companyId'>>()
    .exec();
  return user?.companyId?.toString() ?? null;
}

export function findByIdInCompany(companyId: string, id: string): Promise<UserRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return UserModel.findOne({ _id: id, companyId }).lean<UserRecord>().exec();
}

export async function listByCompany(
  companyId: string,
  filter: UserFilter,
  page: SkipLimit,
): Promise<{ items: UserRecord[]; total: number }> {
  const query = { companyId, ...filter };
  const [items, total] = await Promise.all([
    UserModel.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<UserRecord[]>()
      .exec(),
    UserModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function existsByEmail(email: string): Promise<boolean> {
  return Boolean(await UserModel.exists({ email: email.trim().toLowerCase() }).exec());
}

export async function create(user: NewUser, session?: DbSession): Promise<UserRecord> {
  const [doc] = await UserModel.create([user], { session: session ?? null });
  if (!doc) throw new Error('User insert returned no document');
  return doc.toObject<UserRecord>();
}

export async function createSuperAdmin(user: NewSuperAdmin): Promise<UserRecord> {
  const doc = await UserModel.create({ ...user, role: USER_ROLES.SUPER_ADMIN });
  return doc.toObject<UserRecord>();
}

/** Users of the given companies, optionally narrowed to one role, sorted by name. */
export function findByCompanyIds(
  companyIds: readonly string[],
  role?: UserRole,
): Promise<UserRecord[]> {
  if (companyIds.length === 0) return Promise.resolve([]);
  return UserModel.find({ companyId: { $in: companyIds }, ...(role && { role }) })
    .sort({ name: 1, _id: 1 })
    .lean<UserRecord[]>()
    .exec();
}

/** Number of users per company id; companies without users are absent. */
export async function countByCompanyIds(
  companyIds: readonly string[],
): Promise<Map<string, number>> {
  if (companyIds.length === 0) return new Map();
  const rows = await UserModel.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { companyId: { $in: companyIds.map((id) => new Types.ObjectId(id)) } } },
    { $group: { _id: '$companyId', count: { $sum: 1 } } },
  ]).exec();
  return new Map(rows.map((row) => [row._id.toString(), row.count]));
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: UserChanges,
): Promise<UserRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return UserModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<UserRecord>()
    .exec();
}
