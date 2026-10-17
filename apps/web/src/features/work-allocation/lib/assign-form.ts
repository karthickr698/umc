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
  if (!siteId) return 'Choose a site';
  if (workers.length === 0) return 'Select at least one worker';
  if (workers.length > WORK_ASSIGNMENT_LIMITS.maxBulkWorkers) {
    return `Select at most ${WORK_ASSIGNMENT_LIMITS.maxBulkWorkers} workers at a time`;
  }
  const needsWorkType = workers.some(
    (worker) => worker.workerType === WORKER_TYPES.CONTRACTOR_EMPLOYEE,
  );
  if (needsWorkType && !workType.trim()) return 'Enter a work type for contractor workers';
  return undefined;
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
