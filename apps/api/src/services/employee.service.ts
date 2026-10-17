import {
  EMPLOYEE_CODE_FORMAT,
  WORKER_TYPES,
  type EmployeeDto,
  type Paginated,
  type TenantUserDto,
} from '@umc/shared';
import * as employeeRepository from '../repositories/employee.repository.js';
import type { EmployeeRecord } from '../repositories/employee.repository.js';
import * as paymentRepository from '../repositories/payment.repository.js';
import * as workAssignmentRepository from '../repositories/work-assignment.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateEmployeeInput,
  ListEmployeesInput,
  UpdateEmployeeInput,
} from '../validators/employee.validator.js';
import { nextSequentialCode } from './sequential-code.service.js';

const EMPLOYEE_NOT_FOUND = 'Employee not found';

export function toEmployeeDto(employee: EmployeeRecord): EmployeeDto {
  return {
    id: employee._id.toString(),
    companyId: employee.companyId.toString(),
    name: employee.name,
    ...(employee.phone !== undefined && { phone: employee.phone }),
    employeeCode: employee.employeeCode,
    role: employee.role,
    dailyRate: employee.dailyRate,
    status: employee.status,
    ...(employee.notes !== undefined && { notes: employee.notes }),
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

/** Owning company of an employee, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return employeeRepository.findCompanyIdById(id);
}

async function assertCodeAvailable(
  companyId: string,
  employeeCode: string,
  excludeId?: string,
): Promise<void> {
  if (await employeeRepository.existsByCode(companyId, employeeCode, excludeId)) {
    throw ApiError.conflict('Employee code already in use', { fields: ['employeeCode'] });
  }
}

export async function list(
  actor: TenantUserDto,
  query: ListEmployeesInput,
): Promise<Paginated<EmployeeDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await employeeRepository.listByCompany(
    actor.companyId,
    filter,
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(items.map(toEmployeeDto), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<EmployeeDto> {
  const employee = await employeeRepository.findByIdInCompany(actor.companyId, id);
  if (!employee) throw ApiError.notFound(EMPLOYEE_NOT_FOUND);
  return toEmployeeDto(employee);
}

/** The new employee always belongs to the actor's company; without a code it gets the next free one. */
export async function create(
  actor: TenantUserDto,
  input: CreateEmployeeInput,
): Promise<EmployeeDto> {
  const { companyId } = actor;
  let { employeeCode } = input;
  if (employeeCode !== undefined) {
    await assertCodeAvailable(companyId, employeeCode);
  } else {
    employeeCode = await nextSequentialCode(companyId, 'employee', EMPLOYEE_CODE_FORMAT, (code) =>
      employeeRepository.existsByCode(companyId, code),
    );
  }
  const employee = await employeeRepository.create({ ...input, employeeCode, companyId });
  return toEmployeeDto(employee);
}

export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeDto> {
  if (input.employeeCode !== undefined) {
    await assertCodeAvailable(actor.companyId, input.employeeCode, id);
  }
  const updated = await employeeRepository.updateInCompany(actor.companyId, id, input);
  if (!updated) throw ApiError.notFound(EMPLOYEE_NOT_FOUND);
  return toEmployeeDto(updated);
}

/** Refused while work assignments or payments still reference the employee. */
export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  const worker = { workerType: WORKER_TYPES.EMPLOYEE, workerId: id };
  if (await workAssignmentRepository.existsForWorker(actor.companyId, worker)) {
    throw ApiError.conflict('Employee still has work assignments; delete them first');
  }
  if (await paymentRepository.existsForWorker(actor.companyId, worker)) {
    throw ApiError.conflict('Employee still has payments; delete them first');
  }
  const deleted = await employeeRepository.deleteInCompany(actor.companyId, id);
  if (!deleted) throw ApiError.notFound(EMPLOYEE_NOT_FOUND);
}
