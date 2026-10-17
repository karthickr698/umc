import { z } from 'zod';
import type { WorkerFinancialReportFilters, WorkerFinancialReportQuery } from '@umc/shared';
import {
  calendarDateSchema,
  objectIdSchema,
  paginationQuerySchema,
  withDateRange,
} from './common.validator.js';

const reportFilterFields = {
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
  siteId: objectIdSchema.optional(),
  employeeId: objectIdSchema.optional(),
  contractorId: objectIdSchema.optional(),
  contractorEmployeeId: objectIdSchema.optional(),
};

/** Own employees have no contractor, so an employee filter excludes the contractor filters. */
function withWorkerFilters<T extends z.ZodObject>(schema: T): T {
  return schema.refine(
    (query) => {
      const { employeeId, contractorId, contractorEmployeeId } = query as {
        employeeId?: string;
        contractorId?: string;
        contractorEmployeeId?: string;
      };
      return employeeId === undefined || (contractorId ?? contractorEmployeeId) === undefined;
    },
    {
      message: 'employeeId cannot be combined with contractorId or contractorEmployeeId',
      path: ['employeeId'],
    },
  );
}

export const workerFinancialReportExportQuerySchema = withWorkerFilters(
  withDateRange(z.object(reportFilterFields)),
) satisfies z.ZodType<WorkerFinancialReportFilters>;

export const workerFinancialReportQuerySchema = withWorkerFilters(
  withDateRange(paginationQuerySchema.extend(reportFilterFields)),
) satisfies z.ZodType<WorkerFinancialReportQuery>;

export type WorkerFinancialReportFiltersInput = z.infer<
  typeof workerFinancialReportExportQuerySchema
>;
export type WorkerFinancialReportInput = z.infer<typeof workerFinancialReportQuerySchema>;
