import { z } from 'zod';
import { WORKER_TYPES, type ListWorkerSummariesQuery, type WorkerSummaryQuery } from '@umc/shared';
import {
  calendarDateSchema,
  objectIdSchema,
  paginationQuerySchema,
  withDateRange,
} from './common.validator.js';

const summaryFilterFields = {
  siteId: objectIdSchema.optional(),
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
};

export const workerSummaryQuerySchema = withDateRange(
  z.object(summaryFilterFields),
) satisfies z.ZodType<WorkerSummaryQuery>;

export const listWorkerSummariesQuerySchema = withDateRange(
  paginationQuerySchema.extend({
    ...summaryFilterFields,
    workerType: z.enum(WORKER_TYPES).optional(),
  }),
) satisfies z.ZodType<ListWorkerSummariesQuery>;

export type WorkerSummaryInput = z.infer<typeof workerSummaryQuerySchema>;
export type ListWorkerSummariesInput = z.infer<typeof listWorkerSummariesQuerySchema>;
