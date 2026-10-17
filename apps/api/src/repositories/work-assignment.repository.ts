import { Types, type QueryFilter } from 'mongoose';
import {
  ACTIVE_WORK_ASSIGNMENT_STATUSES,
  type WorkAssignmentStatus,
  type WorkerType,
} from '@umc/shared';
import { WorkAssignmentModel, type WorkAssignment } from '../models/work-assignment.model.js';
import {
  createAttachmentRepository,
  deleteReturningAttachments,
} from '../utils/attachment-queries.js';
import type { Attachment } from '../utils/attachment-schema.js';
import { findCompanyIdOf } from '../utils/company-scope.js';
import type { SkipLimit } from '../utils/pagination.js';
import type { DbSession } from '../utils/transaction.js';
import { workerIdField, type WorkerRef } from '../utils/worker-ref.js';

export type WorkAssignmentRecord = WorkAssignment & { _id: Types.ObjectId };

export interface WorkAssignmentFilter {
  siteId?: string;
  workerType?: WorkerType;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  /** Matches either an employee or a contractor employee id. */
  workerId?: string;
  status?: WorkAssignmentStatus;
  /** Inclusive range of stored calendar days. */
  from?: Date;
  to?: Date;
}

type EditableFields = 'date' | 'workType' | 'dailyRate' | 'notes';

export type NewWorkAssignment = Pick<WorkAssignment, EditableFields | 'workerType'> & {
  companyId: string;
  siteId: string;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  status?: WorkAssignmentStatus;
};

export type WorkAssignmentChanges = Partial<
  Pick<WorkAssignment, EditableFields | 'status'> & {
    siteId: string;
    employeeId: string;
    contractorId: string;
    contractorEmployeeId: string;
  }
>;

export function findCompanyIdById(id: string): Promise<string | null> {
  return findCompanyIdOf(WorkAssignmentModel, id);
}

export function findByIdInCompany(
  companyId: string,
  id: string,
): Promise<WorkAssignmentRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return WorkAssignmentModel.findOne({ _id: id, companyId }).lean<WorkAssignmentRecord>().exec();
}

/** The worker's SCHEDULED or COMPLETED assignment on `date`, if any (cancelled ones don't count). */
export function findActiveForWorkerOnDate(
  companyId: string,
  { workerType, workerId }: WorkerRef,
  date: Date,
  excludeId?: string,
): Promise<WorkAssignmentRecord | null> {
  const query: QueryFilter<WorkAssignment> = {
    companyId,
    [workerIdField(workerType)]: workerId,
    date,
    status: { $in: [...ACTIVE_WORK_ASSIGNMENT_STATUSES] },
  };
  if (excludeId !== undefined) query._id = { $ne: excludeId };
  return WorkAssignmentModel.findOne(query).lean<WorkAssignmentRecord>().exec();
}

/** The SCHEDULED or COMPLETED assignments any of the given workers already hold on `date`. */
export function findActiveForWorkersOnDate(
  companyId: string,
  workerType: WorkerType,
  workerIds: readonly string[],
  date: Date,
  session?: DbSession,
): Promise<WorkAssignmentRecord[]> {
  const query: QueryFilter<WorkAssignment> = {
    companyId,
    [workerIdField(workerType)]: { $in: workerIds },
    date,
    status: { $in: [...ACTIVE_WORK_ASSIGNMENT_STATUSES] },
  };
  return WorkAssignmentModel.find(query)
    .session(session ?? null)
    .lean<WorkAssignmentRecord[]>()
    .exec();
}

export async function existsForSite(companyId: string, siteId: string): Promise<boolean> {
  return Boolean(await WorkAssignmentModel.exists({ companyId, siteId }).exec());
}

export async function existsForWorker(companyId: string, worker: WorkerRef): Promise<boolean> {
  const query = { companyId, [workerIdField(worker.workerType)]: worker.workerId };
  return Boolean(await WorkAssignmentModel.exists(query).exec());
}

/** Whether the worker has a SCHEDULED or COMPLETED assignment at the site on any day. */
export async function existsActiveForWorkerAtSite(
  companyId: string,
  worker: WorkerRef,
  siteId: string,
): Promise<boolean> {
  const query: QueryFilter<WorkAssignment> = {
    companyId,
    siteId,
    [workerIdField(worker.workerType)]: worker.workerId,
    status: { $in: [...ACTIVE_WORK_ASSIGNMENT_STATUSES] },
  };
  return Boolean(await WorkAssignmentModel.exists(query).exec());
}

/**
 * The worker's SCHEDULED or COMPLETED assignments between `from` and `to` (inclusive), optionally
 * at one site, oldest first. Unpaginated: callers must bound the range.
 */
export function listActiveForWorkerInRange(
  companyId: string,
  worker: WorkerRef,
  range: { from: Date; to: Date; siteId?: string },
): Promise<WorkAssignmentRecord[]> {
  const query: QueryFilter<WorkAssignment> = {
    companyId,
    [workerIdField(worker.workerType)]: worker.workerId,
    date: { $gte: range.from, $lte: range.to },
    status: { $in: [...ACTIVE_WORK_ASSIGNMENT_STATUSES] },
  };
  if (range.siteId) query.siteId = range.siteId;
  return WorkAssignmentModel.find(query)
    .sort({ date: 1, _id: 1 })
    .lean<WorkAssignmentRecord[]>()
    .exec();
}

function toQuery(companyId: string, filter: WorkAssignmentFilter): QueryFilter<WorkAssignment> {
  const { siteId, workerType, employeeId, contractorId, contractorEmployeeId, workerId, status } =
    filter;
  const query: QueryFilter<WorkAssignment> = { companyId };
  if (siteId) query.siteId = siteId;
  if (workerType) query.workerType = workerType;
  if (employeeId) query.employeeId = employeeId;
  if (contractorId) query.contractorId = contractorId;
  if (contractorEmployeeId) query.contractorEmployeeId = contractorEmployeeId;
  if (workerId) query.$or = [{ employeeId: workerId }, { contractorEmployeeId: workerId }];
  if (status) query.status = status;
  if (filter.from || filter.to) {
    query.date = {
      ...(filter.from && { $gte: filter.from }),
      ...(filter.to && { $lte: filter.to }),
    };
  }
  return query;
}

/** Newest day first; within a day, grouped by site. */
export async function listByCompany(
  companyId: string,
  filter: WorkAssignmentFilter,
  page: SkipLimit,
): Promise<{ items: WorkAssignmentRecord[]; total: number }> {
  const query = toQuery(companyId, filter);
  const [items, total] = await Promise.all([
    WorkAssignmentModel.find(query)
      .sort({ date: -1, siteId: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean<WorkAssignmentRecord[]>()
      .exec(),
    WorkAssignmentModel.countDocuments(query).exec(),
  ]);
  return { items, total };
}

export async function create(assignment: NewWorkAssignment): Promise<WorkAssignmentRecord> {
  const doc = await WorkAssignmentModel.create(assignment);
  return doc.toObject<WorkAssignmentRecord>();
}

/** Inserts in order and fails as a whole on the first invalid or duplicate assignment. */
export async function createMany(
  assignments: NewWorkAssignment[],
  session?: DbSession,
): Promise<WorkAssignmentRecord[]> {
  if (assignments.length === 0) return [];
  const docs = await WorkAssignmentModel.insertMany(assignments, { session: session ?? null });
  return docs.map((doc) => doc.toObject<WorkAssignmentRecord>());
}

export function updateInCompany(
  companyId: string,
  id: string,
  changes: WorkAssignmentChanges,
): Promise<WorkAssignmentRecord | null> {
  if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
  return WorkAssignmentModel.findOneAndUpdate(
    { _id: id, companyId },
    { $set: changes },
    { returnDocument: 'after', runValidators: true },
  )
    .lean<WorkAssignmentRecord>()
    .exec();
}

/** Resolves to the deleted assignment's attachments, or `null` when nothing was deleted. */
export function deleteInCompany(companyId: string, id: string): Promise<Attachment[] | null> {
  return deleteReturningAttachments(WorkAssignmentModel, companyId, id);
}

export const attachments = createAttachmentRepository(WorkAssignmentModel);
