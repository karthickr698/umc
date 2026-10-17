import type {
  BulkAssignmentFailureReason,
  WORKER_TYPES,
  WorkAssignmentStatus,
  WorkerType,
} from '../constants/domain.js';
import type { WorkAssignmentDto } from './domain.js';

interface WorkAssignmentFields {
  /** Must belong to the caller's company. */
  siteId: string;
  /** Calendar day, `YYYY-MM-DD`. */
  date: string;
  workType: string;
  /** Defaults to the worker's current daily rate. */
  dailyRate?: number;
  status?: WorkAssignmentStatus;
  notes?: string;
}

/**
 * The new assignment always belongs to the caller's company, and every referenced record must be
 * in that company too. A worker can hold only one SCHEDULED or COMPLETED assignment per date.
 */
export type CreateWorkAssignmentRequest =
  | (WorkAssignmentFields & {
      workerType: typeof WORKER_TYPES.EMPLOYEE;
      employeeId: string;
    })
  | (WorkAssignmentFields & {
      workerType: typeof WORKER_TYPES.CONTRACTOR_EMPLOYEE;
      contractorEmployeeId: string;
      /** Derived from the contractor employee; when sent it must match. */
      contractorId?: string;
    });

/**
 * `POST /work-assignments/bulk`: schedules every listed worker at one site for one day. Each
 * worker succeeds or fails on its own; the site must belong to the caller's company.
 */
export interface BulkCreateWorkAssignmentsRequest {
  siteId: string;
  /** Calendar day, `YYYY-MM-DD`. */
  date: string;
  /**
   * At least one id across both lists, and at most `WORK_ASSIGNMENT_LIMITS.maxBulkWorkers` in
   * total.
   */
  employeeIds?: string[];
  contractorEmployeeIds?: string[];
  /**
   * Defaults to each employee's job role. Required when `contractorEmployeeIds` is not empty,
   * since contractor employees have no role.
   */
  workType?: string;
}

export interface BulkWorkAssignmentFailure {
  workerType: WorkerType;
  /** The employee or contractor employee id as sent. */
  workerId: string;
  reason: BulkAssignmentFailureReason;
  message: string;
  /** For `ALREADY_ASSIGNED`: the assignment that already occupies the day. */
  existingAssignmentId?: string;
  existingSiteId?: string;
}

/** Both lists follow the request order: `employeeIds` first, then `contractorEmployeeIds`. */
export interface BulkCreateWorkAssignmentsResult {
  succeeded: WorkAssignmentDto[];
  failed: BulkWorkAssignmentFailure[];
}

/** `workerType` cannot change; send the id field matching the assignment's worker type. */
export interface UpdateWorkAssignmentRequest {
  siteId?: string;
  employeeId?: string;
  contractorEmployeeId?: string;
  date?: string;
  workType?: string;
  /** When the worker changes and this is omitted, the new worker's rate is used. */
  dailyRate?: number;
  status?: WorkAssignmentStatus;
  notes?: string;
}

export interface ListWorkAssignmentsQuery {
  page?: number;
  pageSize?: number;
  siteId?: string;
  workerType?: WorkerType;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  status?: WorkAssignmentStatus;
  /** Inclusive calendar-day range, `YYYY-MM-DD`. */
  from?: string;
  to?: string;
}

/** `GET /work-assignments/daily/:date`. */
export type DailyWorkAssignmentsQuery = Omit<ListWorkAssignmentsQuery, 'from' | 'to'>;

/** `GET /work-assignments/sites/:siteId`. */
export type SiteWorkAssignmentsQuery = Omit<ListWorkAssignmentsQuery, 'siteId'>;

/** `GET /work-assignments/workers/:workerId`; the id may be an employee or contractor employee. */
export type WorkerWorkAssignmentsQuery = Omit<
  ListWorkAssignmentsQuery,
  'workerType' | 'employeeId' | 'contractorId' | 'contractorEmployeeId'
>;
