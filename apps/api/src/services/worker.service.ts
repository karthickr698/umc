import { WORKER_TYPES, type WorkerType } from '@umc/shared';
import * as contractorEmployeeRepository from '../repositories/contractor-employee.repository.js';
import * as contractorRepository from '../repositories/contractor.repository.js';
import * as employeeRepository from '../repositories/employee.repository.js';
import { ApiError } from '../utils/api-error.js';
import type { WorkerRef } from '../utils/worker-ref.js';

/** A worker verified to belong to the company, with the identity fields a record stores for it. */
export interface ResolvedWorker {
  ref: WorkerRef;
  fields: { employeeId: string } | { contractorId: string; contractorEmployeeId: string };
  dailyRate: number;
}

// Records from another company are reported as missing so their ids cannot be probed.

export async function resolveEmployee(
  companyId: string,
  employeeId: string,
): Promise<ResolvedWorker> {
  const employee = await employeeRepository.findByIdInCompany(companyId, employeeId);
  if (!employee) {
    throw ApiError.validation([{ path: 'employeeId', message: 'Employee not found' }]);
  }
  return {
    ref: { workerType: WORKER_TYPES.EMPLOYEE, workerId: employeeId },
    fields: { employeeId },
    dailyRate: employee.dailyRate,
  };
}

/** `contractorId`, when given, must be the contractor that supplies the contractor employee. */
export async function resolveContractorEmployee(
  companyId: string,
  contractorEmployeeId: string,
  contractorId?: string,
): Promise<ResolvedWorker> {
  const employee = await contractorEmployeeRepository.findByIdInCompany(
    companyId,
    contractorEmployeeId,
  );
  if (!employee) {
    throw ApiError.validation([
      { path: 'contractorEmployeeId', message: 'Contractor employee not found' },
    ]);
  }

  const ownerId = employee.contractorId.toString();
  if (contractorId !== undefined && contractorId !== ownerId) {
    throw ApiError.validation([
      { path: 'contractorId', message: 'Contractor employee does not belong to this contractor' },
    ]);
  }
  if (!(await contractorRepository.existsInCompany(companyId, ownerId))) {
    throw ApiError.validation([{ path: 'contractorId', message: 'Contractor not found' }]);
  }

  return {
    ref: { workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE, workerId: contractorEmployeeId },
    fields: { contractorId: ownerId, contractorEmployeeId },
    dailyRate: employee.dailyRate,
  };
}

/** Resolves the worker named by a create request, whichever kind it is. */
export function resolveWorker(
  companyId: string,
  input:
    | { workerType: typeof WORKER_TYPES.EMPLOYEE; employeeId: string }
    | {
        workerType: typeof WORKER_TYPES.CONTRACTOR_EMPLOYEE;
        contractorEmployeeId: string;
        contractorId?: string;
      },
): Promise<ResolvedWorker> {
  return input.workerType === WORKER_TYPES.EMPLOYEE
    ? resolveEmployee(companyId, input.employeeId)
    : resolveContractorEmployee(companyId, input.contractorEmployeeId, input.contractorId);
}

function notAllowedFor(path: string, workerType: WorkerType): ApiError {
  return ApiError.validation([
    { path, message: `${path} is not allowed for ${workerType} records` },
  ]);
}

/**
 * The replacement worker for an existing record, or `null` when the update doesn't change the
 * worker. The record's `workerType` is fixed, so only its matching id field is accepted.
 */
export async function resolveReplacementWorker(
  companyId: string,
  workerType: WorkerType,
  { employeeId, contractorEmployeeId }: { employeeId?: string; contractorEmployeeId?: string },
): Promise<ResolvedWorker | null> {
  if (workerType === WORKER_TYPES.EMPLOYEE) {
    if (contractorEmployeeId !== undefined) throw notAllowedFor('contractorEmployeeId', workerType);
    return employeeId === undefined ? null : resolveEmployee(companyId, employeeId);
  }
  if (employeeId !== undefined) throw notAllowedFor('employeeId', workerType);
  return contractorEmployeeId === undefined
    ? null
    : resolveContractorEmployee(companyId, contractorEmployeeId);
}

export interface WorkerProfile {
  ref: WorkerRef;
  name: string;
  employeeCode: string;
  /** Set for contractor employees. */
  contractorId?: string;
}

/** Worker-wise lookups accept either kind of worker id. */
export async function getWorkerProfile(
  companyId: string,
  workerId: string,
): Promise<WorkerProfile> {
  const [employee, contractorEmployee] = await Promise.all([
    employeeRepository.findByIdInCompany(companyId, workerId),
    contractorEmployeeRepository.findByIdInCompany(companyId, workerId),
  ]);
  if (employee) {
    return {
      ref: { workerType: WORKER_TYPES.EMPLOYEE, workerId },
      name: employee.name,
      employeeCode: employee.employeeCode,
    };
  }
  if (contractorEmployee) {
    return {
      ref: { workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE, workerId },
      name: contractorEmployee.name,
      employeeCode: contractorEmployee.employeeCode,
      contractorId: contractorEmployee.contractorId.toString(),
    };
  }
  throw ApiError.notFound('Worker not found');
}

export async function assertWorkerExists(companyId: string, workerId: string): Promise<void> {
  await getWorkerProfile(companyId, workerId);
}

/** The worker stored on a record using `workerIdentityFields`. */
export function workerRefOf(record: {
  workerType: WorkerType;
  employeeId?: { toString(): string };
  contractorEmployeeId?: { toString(): string };
}): WorkerRef {
  const workerId = record.employeeId ?? record.contractorEmployeeId;
  if (!workerId) throw ApiError.internal(new Error('Record has no worker'));
  return { workerType: record.workerType, workerId: workerId.toString() };
}
