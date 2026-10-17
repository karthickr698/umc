import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  EMPLOYEE_STATUSES,
  WORKER_TYPES,
  type ContractorEmployeeDto,
  type EmployeeDto,
  type WorkAssignmentDto,
  type WorkerType,
} from '@umc/shared';
import { workerKey } from '@/lib/worker-key';

/** An employee or contractor employee, flattened for picking and display. */
export interface AllocationWorker {
  /** Unique across both kinds; see `workerKey`. */
  key: string;
  id: string;
  workerType: WorkerType;
  name: string;
  code: string;
  /** Employees only; contractor employees have no job role. */
  role?: string;
  active: boolean;
}

export function assignmentWorkerKey(assignment: WorkAssignmentDto): string {
  const id = assignment.employeeId ?? assignment.contractorEmployeeId ?? '';
  return workerKey(assignment.workerType, id);
}

/** Every worker of both kinds, sorted by name. */
export function toWorkers(
  employees: readonly EmployeeDto[],
  contractorEmployees: readonly ContractorEmployeeDto[],
): AllocationWorker[] {
  const workers: AllocationWorker[] = [
    ...employees.map((employee) => ({
      key: workerKey(WORKER_TYPES.EMPLOYEE, employee.id),
      id: employee.id,
      workerType: WORKER_TYPES.EMPLOYEE,
      name: employee.name,
      code: employee.employeeCode,
      role: employee.role,
      active: employee.status === EMPLOYEE_STATUSES.ACTIVE,
    })),
    ...contractorEmployees.map((employee) => ({
      key: workerKey(WORKER_TYPES.CONTRACTOR_EMPLOYEE, employee.id),
      id: employee.id,
      workerType: WORKER_TYPES.CONTRACTOR_EMPLOYEE,
      name: employee.name,
      code: employee.employeeCode,
      active: employee.status === CONTRACTOR_EMPLOYEE_STATUSES.ACTIVE,
    })),
  ];
  return workers.sort((a, b) => a.name.localeCompare(b.name));
}

/** Case-insensitive match on name, code or role; an empty query matches everyone. */
export function matchesWorker(worker: AllocationWorker, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [worker.name, worker.code, worker.role ?? ''].some((field) =>
    field.toLowerCase().includes(needle),
  );
}
