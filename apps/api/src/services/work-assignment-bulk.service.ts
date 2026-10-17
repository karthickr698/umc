import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  BULK_ASSIGNMENT_FAILURE_REASONS,
  WORKER_TYPES,
  WORK_ASSIGNMENT_STATUSES,
  type BulkCreateWorkAssignmentsResult,
  type BulkWorkAssignmentFailure,
  type TenantUserDto,
  type WorkerType,
} from '@umc/shared';
import * as contractorEmployeeRepository from '../repositories/contractor-employee.repository.js';
import * as contractorRepository from '../repositories/contractor.repository.js';
import * as employeeRepository from '../repositories/employee.repository.js';
import * as workAssignmentRepository from '../repositories/work-assignment.repository.js';
import type {
  NewWorkAssignment,
  WorkAssignmentRecord,
} from '../repositories/work-assignment.repository.js';
import { fromCalendarDate } from '../utils/calendar-date.js';
import { withTransaction, type DbSession } from '../utils/transaction.js';
import type { WorkerRef } from '../utils/worker-ref.js';
import type { BulkCreateWorkAssignmentsInput } from '../validators/work-assignment.validator.js';
import * as auditLogService from './audit-log.service.js';
import {
  assertSiteInCompany,
  toAuditSnapshot,
  toWorkAssignmentDto,
} from './work-assignment.service.js';
import { workerRefOf, type ResolvedWorker } from './worker.service.js';

/** A requested worker verified to belong to the company. */
interface Candidate {
  fields: ResolvedWorker['fields'];
  dailyRate: number;
  /** Used when the request names no work type. */
  defaultWorkType?: string;
}

const NOT_FOUND_MESSAGES: Readonly<Record<WorkerType, string>> = {
  [WORKER_TYPES.EMPLOYEE]: 'Employee not found',
  [WORKER_TYPES.CONTRACTOR_EMPLOYEE]: 'Contractor employee not found',
};

const workerKey = ({ workerType, workerId }: WorkerRef) => `${workerType}:${workerId}`;

async function loadEmployees(
  companyId: string,
  ids: readonly string[],
  session: DbSession,
): Promise<Map<string, Candidate>> {
  const employees = await employeeRepository.findManyByIdsInCompany(companyId, ids, session);
  return new Map(
    employees.map((employee) => {
      const employeeId = employee._id.toString();
      const candidate: Candidate = {
        fields: { employeeId },
        dailyRate: employee.dailyRate,
        defaultWorkType: employee.role,
      };
      return [workerKey({ workerType: WORKER_TYPES.EMPLOYEE, workerId: employeeId }), candidate];
    }),
  );
}

/** Contractor employees whose contractor is not in the company are left out, as if missing. */
async function loadContractorEmployees(
  companyId: string,
  ids: readonly string[],
  session: DbSession,
): Promise<Map<string, Candidate>> {
  const employees = await contractorEmployeeRepository.findManyByIdsInCompany(
    companyId,
    ids,
    session,
  );
  const contractorIds = [...new Set(employees.map((employee) => employee.contractorId.toString()))];
  const existingContractors = new Set(
    await contractorRepository.findExistingIdsInCompany(companyId, contractorIds, session),
  );

  const candidates = new Map<string, Candidate>();
  for (const employee of employees) {
    const contractorId = employee.contractorId.toString();
    if (!existingContractors.has(contractorId)) continue;
    const contractorEmployeeId = employee._id.toString();
    candidates.set(
      workerKey({ workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE, workerId: contractorEmployeeId }),
      { fields: { contractorId, contractorEmployeeId }, dailyRate: employee.dailyRate },
    );
  }
  return candidates;
}

function failure(
  worker: WorkerRef,
  reason: BulkWorkAssignmentFailure['reason'],
  message: string,
  clash?: WorkAssignmentRecord,
): BulkWorkAssignmentFailure {
  return {
    workerType: worker.workerType,
    workerId: worker.workerId,
    reason,
    message,
    ...(clash && {
      existingAssignmentId: clash._id.toString(),
      existingSiteId: clash.siteId.toString(),
    }),
  };
}

/**
 * Schedules each listed worker at the site for the day. Workers that cannot be assigned are
 * reported in `failed` instead of failing the request; an unknown site fails the whole request.
 *
 * The checks and inserts share one transaction, so a concurrent request booking the same worker
 * forces a retry that sees the new booking and reports it as `ALREADY_ASSIGNED`.
 */
export async function bulkCreate(
  actor: TenantUserDto,
  input: BulkCreateWorkAssignmentsInput,
): Promise<BulkCreateWorkAssignmentsResult> {
  const { companyId } = actor;
  const date = fromCalendarDate(input.date);
  const employeeIds = [...new Set(input.employeeIds)];
  const contractorEmployeeIds = [...new Set(input.contractorEmployeeIds)];
  const requested: WorkerRef[] = [
    ...input.employeeIds.map((workerId) => ({ workerType: WORKER_TYPES.EMPLOYEE, workerId })),
    ...input.contractorEmployeeIds.map((workerId) => ({
      workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE,
      workerId,
    })),
  ];

  const { created, failed } = await withTransaction(async (session) => {
    await assertSiteInCompany(companyId, input.siteId, session);
    const [employees, contractorEmployees, existingForEmployees, existingForContractorEmployees] =
      await Promise.all([
        loadEmployees(companyId, employeeIds, session),
        loadContractorEmployees(companyId, contractorEmployeeIds, session),
        workAssignmentRepository.findActiveForWorkersOnDate(
          companyId,
          WORKER_TYPES.EMPLOYEE,
          employeeIds,
          date,
          session,
        ),
        workAssignmentRepository.findActiveForWorkersOnDate(
          companyId,
          WORKER_TYPES.CONTRACTOR_EMPLOYEE,
          contractorEmployeeIds,
          date,
          session,
        ),
      ]);
    const candidates = new Map([...employees, ...contractorEmployees]);
    const clashes = new Map(
      [...existingForEmployees, ...existingForContractorEmployees].map((assignment) => [
        workerKey(workerRefOf(assignment)),
        assignment,
      ]),
    );

    const failed: BulkWorkAssignmentFailure[] = [];
    const toCreate: NewWorkAssignment[] = [];
    const seen = new Set<string>();

    for (const worker of requested) {
      const key = workerKey(worker);
      if (seen.has(key)) {
        failed.push(
          failure(
            worker,
            BULK_ASSIGNMENT_FAILURE_REASONS.DUPLICATE_IN_REQUEST,
            'Worker is listed more than once',
          ),
        );
        continue;
      }
      seen.add(key);

      const candidate = candidates.get(key);
      if (!candidate) {
        failed.push(
          failure(
            worker,
            BULK_ASSIGNMENT_FAILURE_REASONS.WORKER_NOT_FOUND,
            NOT_FOUND_MESSAGES[worker.workerType],
          ),
        );
        continue;
      }

      const clash = clashes.get(key);
      if (clash) {
        failed.push(
          failure(
            worker,
            BULK_ASSIGNMENT_FAILURE_REASONS.ALREADY_ASSIGNED,
            'Worker is already assigned to a site on this date',
            clash,
          ),
        );
        continue;
      }

      // The validator requires `workType` whenever a worker without a default is listed.
      const workType = input.workType ?? candidate.defaultWorkType ?? '';
      toCreate.push({
        companyId,
        siteId: input.siteId,
        workerType: worker.workerType,
        ...candidate.fields,
        date,
        workType,
        dailyRate: candidate.dailyRate,
        status: WORK_ASSIGNMENT_STATUSES.SCHEDULED,
      });
    }

    return { created: await workAssignmentRepository.createMany(toCreate, session), failed };
  });

  // Recorded after the commit, so transaction retries do not log the same assignments twice.
  await auditLogService.recordMany(
    actor,
    created.map((assignment) => ({
      action: AUDIT_ACTIONS.CREATE,
      entity: AUDIT_ENTITIES.WORK_ASSIGNMENT,
      entityId: assignment._id.toString(),
      metadata: { ...toAuditSnapshot(assignment), bulk: true },
    })),
  );
  return { succeeded: await Promise.all(created.map(toWorkAssignmentDto)), failed };
}
