import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  WORK_ASSIGNMENT_STATUSES,
  isActiveWorkAssignmentStatus,
  type Paginated,
  type TenantUserDto,
  type WorkAssignmentDto,
  type WorkAssignmentStatus,
} from '@umc/shared';
import * as siteRepository from '../repositories/site.repository.js';
import * as workAssignmentRepository from '../repositories/work-assignment.repository.js';
import type {
  WorkAssignmentChanges,
  WorkAssignmentRecord,
} from '../repositories/work-assignment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { fromCalendarDate, toCalendarDate } from '../utils/calendar-date.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type { DbSession } from '../utils/transaction.js';
import type { WorkerRef } from '../utils/worker-ref.js';
import type {
  CreateWorkAssignmentInput,
  DailyWorkAssignmentsInput,
  ListWorkAssignmentsInput,
  SiteWorkAssignmentsInput,
  UpdateWorkAssignmentInput,
  WorkerWorkAssignmentsInput,
} from '../validators/work-assignment.validator.js';
import {
  createAttachmentService,
  deleteStoredFiles,
  toAttachmentDtos,
} from './attachment.service.js';
import * as auditLogService from './audit-log.service.js';
import { changedFields, type AuditSnapshot } from './audit-log.service.js';
import {
  assertWorkerExists,
  resolveReplacementWorker,
  resolveWorker,
  workerRefOf,
} from './worker.service.js';

const WORK_ASSIGNMENT_NOT_FOUND = 'Work assignment not found';

export const attachments = createAttachmentService({
  folder: 'work-assignments',
  notFoundMessage: WORK_ASSIGNMENT_NOT_FOUND,
  repository: workAssignmentRepository.attachments,
});

export async function toWorkAssignmentDto(
  assignment: WorkAssignmentRecord,
): Promise<WorkAssignmentDto> {
  return {
    id: assignment._id.toString(),
    companyId: assignment.companyId.toString(),
    siteId: assignment.siteId.toString(),
    workerType: assignment.workerType,
    ...(assignment.employeeId && { employeeId: assignment.employeeId.toString() }),
    ...(assignment.contractorId && { contractorId: assignment.contractorId.toString() }),
    ...(assignment.contractorEmployeeId && {
      contractorEmployeeId: assignment.contractorEmployeeId.toString(),
    }),
    date: toCalendarDate(assignment.date),
    workType: assignment.workType,
    dailyRate: assignment.dailyRate,
    status: assignment.status,
    ...(assignment.notes !== undefined && { notes: assignment.notes }),
    attachments: await toAttachmentDtos(assignment.attachments),
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}

export function toAuditSnapshot(assignment: WorkAssignmentRecord): AuditSnapshot {
  return {
    siteId: assignment.siteId.toString(),
    workerType: assignment.workerType,
    employeeId: assignment.employeeId?.toString(),
    contractorId: assignment.contractorId?.toString(),
    contractorEmployeeId: assignment.contractorEmployeeId?.toString(),
    date: toCalendarDate(assignment.date),
    workType: assignment.workType,
    dailyRate: assignment.dailyRate,
    status: assignment.status,
  };
}

/** Owning company of an assignment, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return workAssignmentRepository.findCompanyIdById(id);
}

/** A site from another company is reported as missing so its id cannot be probed. */
export async function assertSiteInCompany(
  companyId: string,
  siteId: string,
  session?: DbSession,
): Promise<void> {
  if (!(await siteRepository.existsInCompany(companyId, siteId, session))) {
    throw ApiError.validation([{ path: 'siteId', message: 'Site not found' }]);
  }
}

/** Cancelled assignments don't occupy the day, so only active ones are checked. */
async function assertWorkerAvailable(
  companyId: string,
  worker: WorkerRef,
  date: Date,
  status: WorkAssignmentStatus,
  excludeId?: string,
): Promise<void> {
  if (!isActiveWorkAssignmentStatus(status)) return;
  const existing = await workAssignmentRepository.findActiveForWorkerOnDate(
    companyId,
    worker,
    date,
    excludeId,
  );
  if (existing) {
    throw ApiError.conflict('Worker is already assigned to a site on this date', {
      fields: ['date'],
      assignmentId: existing._id.toString(),
      siteId: existing.siteId.toString(),
    });
  }
}

type ListInput = ListWorkAssignmentsInput & { workerId?: string };

async function listWithFilter(
  companyId: string,
  { page, pageSize, from, to, ...filter }: ListInput,
): Promise<Paginated<WorkAssignmentDto>> {
  const { items, total } = await workAssignmentRepository.listByCompany(
    companyId,
    {
      ...filter,
      ...(from !== undefined && { from: fromCalendarDate(from) }),
      ...(to !== undefined && { to: fromCalendarDate(to) }),
    },
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(await Promise.all(items.map(toWorkAssignmentDto)), total, {
    page,
    pageSize,
  });
}

export function list(
  actor: TenantUserDto,
  query: ListWorkAssignmentsInput,
): Promise<Paginated<WorkAssignmentDto>> {
  return listWithFilter(actor.companyId, query);
}

export function listDaily(
  actor: TenantUserDto,
  date: string,
  query: DailyWorkAssignmentsInput,
): Promise<Paginated<WorkAssignmentDto>> {
  return listWithFilter(actor.companyId, { ...query, from: date, to: date });
}

export async function listForSite(
  actor: TenantUserDto,
  siteId: string,
  query: SiteWorkAssignmentsInput,
): Promise<Paginated<WorkAssignmentDto>> {
  if (!(await siteRepository.existsInCompany(actor.companyId, siteId))) {
    throw ApiError.notFound('Site not found');
  }
  return listWithFilter(actor.companyId, { ...query, siteId });
}

/** `workerId` may name an employee or a contractor employee. */
export async function listForWorker(
  actor: TenantUserDto,
  workerId: string,
  query: WorkerWorkAssignmentsInput,
): Promise<Paginated<WorkAssignmentDto>> {
  await assertWorkerExists(actor.companyId, workerId);
  return listWithFilter(actor.companyId, { ...query, workerId });
}

export async function getById(actor: TenantUserDto, id: string): Promise<WorkAssignmentDto> {
  const assignment = await workAssignmentRepository.findByIdInCompany(actor.companyId, id);
  if (!assignment) throw ApiError.notFound(WORK_ASSIGNMENT_NOT_FOUND);
  return toWorkAssignmentDto(assignment);
}

/** The new assignment always belongs to the actor's company, as must every record it references. */
export async function create(
  actor: TenantUserDto,
  input: CreateWorkAssignmentInput,
): Promise<WorkAssignmentDto> {
  const { companyId } = actor;
  const worker = await resolveWorker(companyId, input);
  await assertSiteInCompany(companyId, input.siteId);

  const date = fromCalendarDate(input.date);
  const status = input.status ?? WORK_ASSIGNMENT_STATUSES.SCHEDULED;
  await assertWorkerAvailable(companyId, worker.ref, date, status);

  const assignment = await workAssignmentRepository.create({
    companyId,
    siteId: input.siteId,
    workerType: input.workerType,
    ...worker.fields,
    date,
    workType: input.workType,
    dailyRate: input.dailyRate ?? worker.dailyRate,
    status,
    ...(input.notes !== undefined && { notes: input.notes }),
  });
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.CREATE,
    entity: AUDIT_ENTITIES.WORK_ASSIGNMENT,
    entityId: assignment._id.toString(),
    metadata: toAuditSnapshot(assignment),
  });
  return toWorkAssignmentDto(assignment);
}

/** Changing the worker re-snapshots the daily rate unless `dailyRate` is also sent. */
export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateWorkAssignmentInput,
): Promise<WorkAssignmentDto> {
  const { companyId } = actor;
  const current = await workAssignmentRepository.findByIdInCompany(companyId, id);
  if (!current) throw ApiError.notFound(WORK_ASSIGNMENT_NOT_FOUND);

  const { employeeId, contractorEmployeeId, date, ...fields } = input;
  const changes: WorkAssignmentChanges = { ...fields };

  const replacement = await resolveReplacementWorker(companyId, current.workerType, {
    employeeId,
    contractorEmployeeId,
  });
  if (replacement) {
    Object.assign(changes, replacement.fields);
    changes.dailyRate ??= replacement.dailyRate;
  }
  if (input.siteId !== undefined) await assertSiteInCompany(companyId, input.siteId);
  if (date !== undefined) changes.date = fromCalendarDate(date);

  await assertWorkerAvailable(
    companyId,
    replacement?.ref ?? workerRefOf(current),
    changes.date ?? current.date,
    changes.status ?? current.status,
    id,
  );

  const updated = await workAssignmentRepository.updateInCompany(companyId, id, changes);
  if (!updated) throw ApiError.notFound(WORK_ASSIGNMENT_NOT_FOUND);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.UPDATE,
    entity: AUDIT_ENTITIES.WORK_ASSIGNMENT,
    entityId: id,
    metadata: { changes: changedFields(toAuditSnapshot(current), toAuditSnapshot(updated)) },
  });
  return toWorkAssignmentDto(updated);
}

export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  const { companyId } = actor;
  const assignment = await workAssignmentRepository.findByIdInCompany(companyId, id);
  if (!assignment) throw ApiError.notFound(WORK_ASSIGNMENT_NOT_FOUND);
  const deletedAttachments = await workAssignmentRepository.deleteInCompany(companyId, id);
  if (!deletedAttachments) throw ApiError.notFound(WORK_ASSIGNMENT_NOT_FOUND);
  await deleteStoredFiles(deletedAttachments);
  await auditLogService.record(actor, {
    action: AUDIT_ACTIONS.DELETE,
    entity: AUDIT_ENTITIES.WORK_ASSIGNMENT,
    entityId: id,
    metadata: toAuditSnapshot(assignment),
  });
}
