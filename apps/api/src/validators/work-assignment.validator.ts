import { z } from 'zod';
import {
  FIELD_LIMITS,
  WORKER_TYPES,
  WORK_ASSIGNMENT_LIMITS,
  WORK_ASSIGNMENT_STATUSES,
  type BulkCreateWorkAssignmentsRequest,
  type CreateWorkAssignmentRequest,
  type UpdateWorkAssignmentRequest,
} from '@umc/shared';
import {
  calendarDateSchema,
  dailyRateSchema,
  notesSchema,
  objectIdSchema,
  paginationQuerySchema,
  requireAnyField,
  withDateRange,
} from './common.validator.js';

const workTypeSchema = z.string().trim().min(1, 'Work type is required').max(FIELD_LIMITS.workType);

const statusSchema = z.enum(WORK_ASSIGNMENT_STATUSES);

const assignmentFields = {
  siteId: objectIdSchema,
  date: calendarDateSchema,
  workType: workTypeSchema,
  dailyRate: dailyRateSchema.optional(),
  status: statusSchema.optional(),
  notes: notesSchema.optional(),
};

export const createWorkAssignmentSchema = z.discriminatedUnion('workerType', [
  z.strictObject({
    ...assignmentFields,
    workerType: z.literal(WORKER_TYPES.EMPLOYEE),
    employeeId: objectIdSchema,
  }),
  z.strictObject({
    ...assignmentFields,
    workerType: z.literal(WORKER_TYPES.CONTRACTOR_EMPLOYEE),
    contractorEmployeeId: objectIdSchema,
    contractorId: objectIdSchema.optional(),
  }),
]) satisfies z.ZodType<CreateWorkAssignmentRequest>;

// Lower-cased so the same id in different letter case is caught as a duplicate.
const bulkWorkerIdsSchema = z.array(objectIdSchema.toLowerCase()).default([]);

export const bulkCreateWorkAssignmentsSchema = z
  .strictObject({
    siteId: objectIdSchema,
    date: calendarDateSchema,
    employeeIds: bulkWorkerIdsSchema,
    contractorEmployeeIds: bulkWorkerIdsSchema,
    workType: workTypeSchema.optional(),
  })
  .superRefine((input, ctx) => {
    const total = input.employeeIds.length + input.contractorEmployeeIds.length;
    if (total === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['employeeIds'],
        message: 'Select at least one worker',
      });
    }
    if (total > WORK_ASSIGNMENT_LIMITS.maxBulkWorkers) {
      ctx.addIssue({
        code: 'custom',
        path: ['employeeIds'],
        message: `Select at most ${WORK_ASSIGNMENT_LIMITS.maxBulkWorkers} workers`,
      });
    }
    if (input.contractorEmployeeIds.length > 0 && input.workType === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['workType'],
        message: 'Work type is required when assigning contractor employees',
      });
    }
  }) satisfies z.ZodType<BulkCreateWorkAssignmentsRequest>;

export const updateWorkAssignmentSchema = requireAnyField(
  z.strictObject({
    siteId: objectIdSchema.optional(),
    employeeId: objectIdSchema.optional(),
    contractorEmployeeId: objectIdSchema.optional(),
    date: calendarDateSchema.optional(),
    workType: workTypeSchema.optional(),
    dailyRate: dailyRateSchema.optional(),
    status: statusSchema.optional(),
    notes: notesSchema.optional(),
  }),
).refine((input) => input.employeeId === undefined || input.contractorEmployeeId === undefined, {
  message: 'Send either employeeId or contractorEmployeeId, not both',
  path: ['contractorEmployeeId'],
}) satisfies z.ZodType<UpdateWorkAssignmentRequest>;

const listFilterSchema = paginationQuerySchema.extend({
  siteId: objectIdSchema.optional(),
  workerType: z.enum(WORKER_TYPES).optional(),
  employeeId: objectIdSchema.optional(),
  contractorId: objectIdSchema.optional(),
  contractorEmployeeId: objectIdSchema.optional(),
  status: statusSchema.optional(),
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
});

export const listWorkAssignmentsQuerySchema = withDateRange(listFilterSchema);

export const dailyWorkAssignmentsQuerySchema = listFilterSchema.omit({ from: true, to: true });

export const siteWorkAssignmentsQuerySchema = withDateRange(
  listFilterSchema.omit({ siteId: true }),
);

export const workerWorkAssignmentsQuerySchema = withDateRange(
  listFilterSchema.omit({
    workerType: true,
    employeeId: true,
    contractorId: true,
    contractorEmployeeId: true,
  }),
);

export const dailyParamsSchema = z.object({ date: calendarDateSchema });
export const siteParamsSchema = z.object({ siteId: objectIdSchema });

export type CreateWorkAssignmentInput = z.infer<typeof createWorkAssignmentSchema>;
export type BulkCreateWorkAssignmentsInput = z.infer<typeof bulkCreateWorkAssignmentsSchema>;
export type UpdateWorkAssignmentInput = z.infer<typeof updateWorkAssignmentSchema>;
export type ListWorkAssignmentsInput = z.infer<typeof listWorkAssignmentsQuerySchema>;
export type DailyWorkAssignmentsInput = z.infer<typeof dailyWorkAssignmentsQuerySchema>;
export type SiteWorkAssignmentsInput = z.infer<typeof siteWorkAssignmentsQuerySchema>;
export type WorkerWorkAssignmentsInput = z.infer<typeof workerWorkAssignmentsQuerySchema>;
