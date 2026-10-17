import {
  WORKER_TYPES,
  type ContractorEmployeeDto,
  type EmployeeDto,
  type WorkAssignmentDto,
} from '@umc/shared';
import { useApiQuery, type ApiQuery } from '@/hooks/use-api-query';
import { useAllPagesQuery } from '@/hooks/use-all-pages-query';
import { monthRange } from '../lib/calendar';
import type { AllocationWorker } from '../lib/workers';
import { WORK_ALLOCATION_API } from '../work-allocation-api';

export type WorkerProfile = EmployeeDto | ContractorEmployeeDto;

export interface WorkerDetail {
  profile: ApiQuery<WorkerProfile>;
  /** The worker's assignments in the month containing the chosen day, newest first. */
  history: ApiQuery<WorkAssignmentDto[]>;
}

export function useWorkerDetail(worker: AllocationWorker, day: string): WorkerDetail {
  const profile = useApiQuery<WorkerProfile>(
    worker.workerType === WORKER_TYPES.EMPLOYEE
      ? WORK_ALLOCATION_API.employee(worker.id)
      : WORK_ALLOCATION_API.contractorEmployee(worker.id),
  );
  const history = useAllPagesQuery<WorkAssignmentDto>(
    WORK_ALLOCATION_API.byWorker(worker.id),
    monthRange(day),
  );
  return { profile, history };
}
