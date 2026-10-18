import {
  WORKER_TYPES,
  WORK_ASSIGNMENT_LIMITS,
  type BulkCreateWorkAssignmentsRequest,
} from '@umc/shared';
import type { AllocationWorker } from './workers';

export interface AssignDraft {
  date: string;
  siteId: string;
  workers: readonly AllocationWorker[];
  workType: string;
}

/** Why the draft can't be submitted yet, mirroring the bulk endpoint's checks; else `undefined`. */
export function assignDraftProblem({ siteId, workers, workType }: AssignDraft): string | undefined {
  if (!siteId) return 'Start by choosing the site in step 1.';
  if (workers.length === 0) return 'Next, tick the workers in step 2.';
  if (workers.length > WORK_ASSIGNMENT_LIMITS.maxBulkWorkers) {
    return `You can assign up to ${WORK_ASSIGNMENT_LIMITS.maxBulkWorkers} workers at a time.`;
  }
  if (needsWorkType(workers) && !workType.trim()) {
    return 'Step 3: enter a work type for contractor workers.';
  }
  return undefined;
}

/** Contractor employees have no job role to fall back on, so they need an explicit work type. */
export function needsWorkType(workers: readonly AllocationWorker[]): boolean {
  return workers.some((worker) => worker.workerType === WORKER_TYPES.CONTRACTOR_EMPLOYEE);
}

export function toBulkRequest({
  date,
  siteId,
  workers,
  workType,
}: AssignDraft): BulkCreateWorkAssignmentsRequest {
  const idsOf = (workerType: AllocationWorker['workerType']) =>
    workers.filter((worker) => worker.workerType === workerType).map((worker) => worker.id);
  const trimmedWorkType = workType.trim();

  return {
    siteId,
    date,
    employeeIds: idsOf(WORKER_TYPES.EMPLOYEE),
    contractorEmployeeIds: idsOf(WORKER_TYPES.CONTRACTOR_EMPLOYEE),
    ...(trimmedWorkType && { workType: trimmedWorkType }),
  };
}
