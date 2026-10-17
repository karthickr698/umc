import { Types, type QueryFilter } from 'mongoose';
import type { EmployeeStatus } from '@umc/shared';
import { EmployeeModel, type Employee } from '../models/employee.model.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import { containsInsensitive } from '../utils/regex.js';
import type { DbSession } from '../utils/transaction.js';

export type EmployeeRecord = Employee & { _id: Types.ObjectId };

export interface EmployeeFilter {
  status?: EmployeeStatus;
  search?: string;
}

type EditableFields = 'name' | 'phone' | 'employeeCode' | 'role' | 'dailyRate' | 'notes';

export type NewEmployee = Pick<Employee, EditableFields> & {
  companyId: string;
  status?: EmployeeStatus;
};

export type EmployeeChanges = Partial<Pick<Employee, EditableFields | 'status'>>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(EmployeeModel, id);
}

export function findByIdInCompany(companyId: string, id: string): Promise<EmployeeRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return EmployeeModel.findOne({ _id: id, companyId }).lean<EmployeeRecord>().exec();
}

/** Ids that are not in the company are simply absent from the result. */
export function findManyByIdsInCompany(
  companyId: string,
  ids: readonly string[],
  session?: DbSession,
): Promise<EmployeeRecord[]> {
  const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
  return EmployeeModel.find({ _id: { $in: validIds }, companyId })
    .session(session ?? null)
    .lean<EmployeeRecord[]>()
    .exec();
}

/** Codes are compared upper-cased, matching how the model stores them. */
export async function existsByCode(
  companyId: string,
  employeeCode: string,
  excludeId?: string,
): Promise<boolean> {
  const query: QueryFilter<Employee> = {
    companyId,
    employeeCode: employeeCode.trim().toUpperCase(),
  };
  if (excludeId !== undefined) query._id = { $ne: excludeId };
  return Boolean(await EmployeeModel.exists(query).exec());
}

function toQuery(companyId: string, { status, search }: EmployeeFilter): QueryFilter<Employee> {
  const query: QueryFilter<Employee> = { companyId };
  if (status) query.status = status;
  if (search) {
    const pattern = containsInsensitive(search);
    query.$or = [
      { name: pattern },
      { employeeCode: pattern },
      { phone: pattern },
      { role: pattern },
    ];
  }
  return query;
}

export async function listByCompany(
  companyId: string,
  filter: EmployeeFilter,
  page: SkipLimit,
): Promise<{ items: EmployeeRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    EmployeeModel.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<EmployeeRecord[]>()
      .exec(),
    EmployeeModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(employee: NewEmployee): Promise<EmployeeRecord> {
  const doc = await EmployeeModel.create(employee);
  return doc.toObject<EmployeeRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: EmployeeChanges,
): Promise<EmployeeRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return EmployeeModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<EmployeeRecord>()
    .exec();
}

/** Resolves to `true` when an employee was deleted. */
export async function deleteInCompany(companyId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const { deletedCount } = await EmployeeModel.deleteOne({ _id: id, companyId }).exec();
  return deletedCount > 0;
}
