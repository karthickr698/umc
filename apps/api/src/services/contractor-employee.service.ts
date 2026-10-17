import {
  CONTRACTOR_WORKER_CODE_FORMAT,
  WORKER_TYPES,
  type ContractorEmployeeDto,
  type Paginated,
  type TenantUserDto,
} from '@umc/shared';
import * as contractorEmployeeRepository from '../repositories/contractor-employee.repository.js';
import type { ContractorEmployeeRecord } from '../repositories/contractor-employee.repository.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import * as workAssignmentRepository from '../repositories/work-assignment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateContractorEmployeeInput,
  ListContractorEmployeesInput,
  UpdateContractorEmployeeInput,
} from '../validators/contractor-employee.validator.js';
import { assertContractorInCompany } from './contractor.service.js';
import { nextSequentialCode } from './sequential-code.service.js';

const CONTRACTOR_EMPLOYEE_NOT_FOUND = 'Contractor employee not found';

export function toContractorEmployeeDto(employee: ContractorEmployeeRecord): ContractorEmployeeDto {
  return {
    id: employee._id.toString(),
    companyId: employee.companyId.toString(),
    contractorId: employee.contractorId.toString(),
    name: employee.name,
    ...(employee.phone !== undefined && { phone: employee.phone }),
    employeeCode: employee.employeeCode,
    dailyRate: employee.dailyRate,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

/** Owning company of a contractor employee, for `requireCompanyOwnership`; `null` when missing. */
export function findCompanyId(id: string): Promise<string | null> {
  return contractorEmployeeRepository.findCompanyIdById(id);
}

async function assertCodeAvailable(
  companyId: string,
  contractorId: string,
  employeeCode: string,
  excludeId?: string,
): Promise<void> {
  if (
    await contractorEmployeeRepository.existsByCode(
      companyId,
      contractorId,
      employeeCode,
      excludeId,
    )
  ) {
    throw ApiError.conflict('Employee code already in use for this contractor', {
      fields: ['employeeCode'],
    });
  }
}

export async function list(
  actor: TenantUserDto,
  query: ListContractorEmployeesInput,
): Promise<Paginated<ContractorEmployeeDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await contractorEmployeeRepository.listByCompany(
    actor.companyId,
    filter,
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(items.map(toContractorEmployeeDto), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<ContractorEmployeeDto> {
  const employee = await contractorEmployeeRepository.findByIdInCompany(actor.companyId, id);
  if (!employee) throw ApiError.notFound(CONTRACTOR_EMPLOYEE_NOT_FOUND);
  return toContractorEmployeeDto(employee);
}

/**
 * The new contractor employee always belongs to the actor's company. Without a code it gets the
 * contractor's next free one; without a daily rate it earns 0 unless an assignment sets a rate.
 */
export async function create(
  actor: TenantUserDto,
  input: CreateContractorEmployeeInput,
): Promise<ContractorEmployeeDto> {
  const { companyId } = actor;
  const { contractorId } = input;
  await assertContractorInCompany(companyId, contractorId);
  let { employeeCode } = input;
  if (employeeCode !== undefined) {
    await assertCodeAvailable(companyId, contractorId, employeeCode);
  } else {
    employeeCode = await nextSequentialCode(
      companyId,
      `contractor-employee:${contractorId}`,
      CONTRACTOR_WORKER_CODE_FORMAT,
      (code) => contractorEmployeeRepository.existsByCode(companyId, contractorId, code),
    );
  }
  const employee = await contractorEmployeeRepository.create({
    ...input,
    employeeCode,
    dailyRate: input.dailyRate ?? 0,
    companyId,
  });
  return toContractorEmployeeDto(employee);
}

/** Codes are unique per contractor, so changing either the code or the contractor re-checks it. */
export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateContractorEmployeeInput,
): Promise<ContractorEmployeeDto> {
  if (input.contractorId !== undefined || input.employeeCode !== undefined) {
    const current = await contractorEmployeeRepository.findByIdInCompany(actor.companyId, id);
    if (!current) throw ApiError.notFound(CONTRACTOR_EMPLOYEE_NOT_FOUND);
    if (input.contractorId !== undefined) {
      await assertContractorInCompany(actor.companyId, input.contractorId);
    }
    await assertCodeAvailable(
      actor.companyId,
      input.contractorId ?? current.contractorId.toString(),
      input.employeeCode ?? current.employeeCode,
      id,
    );
  }

  const updated = await contractorEmployeeRepository.updateInCompany(actor.companyId, id, input);
  if (!updated) throw ApiError.notFound(CONTRACTOR_EMPLOYEE_NOT_FOUND);
  return toContractorEmployeeDto(updated);
}

/** Refused while work assignments or payments still reference the contractor employee. */
export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  const worker = { workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE, workerId: id };
  if (await workAssignmentRepository.existsForWorker(actor.companyId, worker)) {
    throw ApiError.conflict('Contractor employee still has work assignments; delete them first');
  }
  if (await paymentRepository.existsForWorker(actor.companyId, worker)) {
    throw ApiError.conflict('Contractor employee still has payments; delete them first');
  }
  const deleted = await contractorEmployeeRepository.deleteInCompany(actor.companyId, id);
  if (!deleted) throw ApiError.notFound(CONTRACTOR_EMPLOYEE_NOT_FOUND);
}
