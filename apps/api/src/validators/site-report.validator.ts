import { z } from 'zod';
import type { SiteFinancialReportQuery } from '@umc/shared';
import { calendarDateSchema, objectIdSchema, withDateRange } from './common.validator.js';

export const siteFinancialReportQuerySchema = withDateRange(
  z.object({
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
    siteId: objectIdSchema.optional(),
  }),
) satisfies z.ZodType<SiteFinancialReportQuery>;

export type SiteFinancialReportInput = z.infer<typeof siteFinancialReportQuerySchema>;
