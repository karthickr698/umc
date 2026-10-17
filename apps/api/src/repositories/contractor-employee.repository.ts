import { Types, type QueryFilter } from 'mongoose';
import type { ContractorEmployeeStatus } from '@umc/shared';
import {
  ContractorEmployeeModel,
  type ContractorEmployee,
} from '../models/contractor-employee.model.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import { containsInsensitive } from '../utils/regex.js';
import type { DbSession } from '../utils/transaction.js';

export type ContractorEmployeeRecord = ContractorEmployee & { _id: Types.ObjectId };

export interface ContractorEmployeeFilter {
  contractorId?: string;
  status?: ContractorEmployeeStatus;
  search?: string;
}

type EditableFields = 'name' | 'phone' | 'employeeCode' | 'dailyRate';

export type NewContractorEmployee = Pick<ContractorEmployee, EditableFields> & {
  companyId: string;
  contractorId: string;
  status?: ContractorEmployeeStatus;
};

export type ContractorEmployeeChanges = Partial<
  Pick<ContractorEmployee, EditableFields | 'status'> & { contractorId: string }
>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(ContractorEmployeeModel, id);
}

export function findByIdInCompany(
  companyId: string,
  id: string,
): Promise<ContractorEmployeeRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ContractorEmployeeModel.findOne({ _id: id, companyId })
    .lean<ContractorEmployeeRecord>()
    .exec();
}

/** Ids that are not in the company are simply absent from the result. */
export function findManyByIdsInCompany(
  companyId: string,
  ids: readonly string[],
  session?: DbSession,
): Promise<ContractorEmployeeRecord[]> {
  const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
  return ContractorEmployeeModel.find({ _id: { $in: validIds }, companyId })
    .session(session ?? null)
    .lean<ContractorEmployeeRecord[]>()
    .exec();
}

/** Codes are compared upper-cased, matching how the model stores them. */
export async function existsByCode(
  companyId: string,
  contractorId: string,
  employeeCode: string,
  excludeId?: string,
): Promise<boolean> {
  const query: QueryFilter<ContractorEmployee> = {
    companyId,
    contractorId,
    employeeCode: employeeCode.trim().toUpperCase(),
  };
  if (excludeId !== undefined) query._id = { $ne: excludeId };
  return Boolean(await ContractorEmployeeModel.exists(query).exec());
}

export async function existsForContractor(
  companyId: string,
  contractorId: string,
): Promise<boolean> {
  return Boolean(await ContractorEmployeeModel.exists({ companyId, contractorId }).exec());
}

function toQuery(
  companyId: string,
  { contractorId, status, search }: ContractorEmployeeFilter,
): QueryFilter<ContractorEmployee> {
  const query: QueryFilter<ContractorEmployee> = { companyId };
  if (contractorId) query.contractorId = contractorId;
  if (status) query.status = status;
  if (search) {
    const pattern = containsInsensitive(search);
    query.$or = [{ name: pattern }, { employeeCode: pattern }, { phone: pattern }];
  }
  return query;
}

export async function listByCompany(
  companyId: string,
  filter: ContractorEmployeeFilter,
  page: SkipLimit,
): Promise<{ items: ContractorEmployeeRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    ContractorEmployeeModel.find(query)
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<ContractorEmployeeRecord[]>()
      .exec(),
    ContractorEmployeeModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(employee: NewContractorEmployee): Promise<ContractorEmployeeRecord> {
  const doc = await ContractorEmployeeModel.create(employee);
  return doc.toObject<ContractorEmployeeRecord>();
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: ContractorEmployeeChanges,
): Promise<ContractorEmployeeRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return ContractorEmployeeModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<ContractorEmployeeRecord>()
    .exec();
}

/** Resolves to `true` when a contractor employee was deleted. */
export async function deleteInCompany(companyId: string, id: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(id)) return false;
  const { deletedCount } = await ContractorEmployeeModel.deleteOne({ _id: id, companyId }).exec();
  return deletedCount > 0;
}
