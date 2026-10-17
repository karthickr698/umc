import { Schema, type Document } from 'mongoose';
import { WORKER_TYPES } from '@umc/shared';

/** Worker reference fields for models that point at either kind of worker. */
export const workerIdentityFields = {
  workerType: { type: String, enum: Object.values(WORKER_TYPES), required: true },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor' },
  contractorEmployeeId: { type: Schema.Types.ObjectId, ref: 'ContractorEmployee' },
} as const;

/**
 * Pre-validate hook: exactly one worker identity is set, depending on `workerType` —
 * `employeeId` for EMPLOYEE, `contractorId` + `contractorEmployeeId` for CONTRACTOR_EMPLOYEE.
 *
 * Document validation only: query updates (`findOneAndUpdate`) skip this hook, so services must
 * keep the worker fields consistent with `workerType` when updating.
 */
export function validateWorkerIdentity(this: Document): void {
  const workerType: unknown = this.get('workerType');
  if (typeof workerType !== 'string' || !Object.values<string>(WORKER_TYPES).includes(workerType)) {
    return;
  }

  const isEmployee = workerType === WORKER_TYPES.EMPLOYEE;
  const required = isEmployee ? ['employeeId'] : ['contractorId', 'contractorEmployeeId'];
  const forbidden = isEmployee ? ['contractorId', 'contractorEmployeeId'] : ['employeeId'];
  const isSet = (path: string): boolean => {
    const value: unknown = this.get(path);
    return value !== undefined && value !== null;
  };

  for (const path of required) {
    if (!isSet(path)) this.invalidate(path, `${path} is required for ${workerType}`);
  }
  for (const path of forbidden) {
    if (isSet(path)) this.invalidate(path, `${path} is not allowed for ${workerType}`);
  }
}
