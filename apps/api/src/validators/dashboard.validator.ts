import { z } from 'zod';
import type { DashboardSummaryQuery } from '@umc/shared';
import { calendarDateSchema, objectIdSchema, withDateRange } from './common.validator.js';

export const dashboardSummaryQuerySchema = withDateRange(
  z.object({
    siteId: objectIdSchema.optional(),
    clientId: objectIdSchema.optional(),
    employeeId: objectIdSchema.optional(),
    contractorId: objectIdSchema.optional(),
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  }),
) satisfies z.ZodType<DashboardSummaryQuery>;

export type DashboardSummaryInput = z.infer<typeof dashboardSummaryQuerySchema>;
