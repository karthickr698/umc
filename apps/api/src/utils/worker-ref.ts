import { WORKER_TYPES, type WorkerType } from '@umc/shared';

/** One worker of either kind; `workerId` is an employee or contractor employee id. */
export interface WorkerRef {
  workerType: WorkerType;
  workerId: string;
}

/** The field that stores the worker's id on records using `workerIdentityFields`. */
export function workerIdField(workerType: WorkerType): 'employeeId' | 'contractorEmployeeId' {
  return workerType === WORKER_TYPES.EMPLOYEE ? 'employeeId' : 'contractorEmployeeId';
}
