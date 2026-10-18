import { useCallback, useMemo } from 'react';
import {
  PAGINATION,
  type WorkerFinancialReportFilters,
  type WorkerFinancialReportQuery,
} from '@umc/shared';
import { activeFilters, useUrlFilters } from '@/hooks/use-url-filters';

const FILTER_KEYS = [
  'from',
  'to',
  'siteId',
  'employeeId',
  'contractorId',
  'contractorEmployeeId',
] as const satisfies readonly (keyof WorkerFinancialReportFilters)[];
const DATE_KEYS = ['from', 'to'] as const satisfies readonly WorkerReportFilterKey[];

export type WorkerReportFilterKey = (typeof FILTER_KEYS)[number];

/** Every filter as a string; an empty string means "not filtered". */
export type WorkerReportFilters = Record<WorkerReportFilterKey, string>;

/**
 * Own employees have no contractor, so picking an employee clears the contractor filters and
 * vice versa. A new contractor also clears a contractor employee it may not supply.
 */
export function withConsistentWorkers(
  changes: Partial<WorkerReportFilters>,
): Partial<WorkerReportFilters> {
  if (changes.employeeId) return { ...changes, contractorId: '', contractorEmployeeId: '' };
  if (changes.contractorId !== undefined && changes.contractorEmployeeId === undefined) {
    return { ...changes, employeeId: '', contractorEmployeeId: '' };
  }
  if (changes.contractorEmployeeId) return { ...changes, employeeId: '' };
  return changes;
}

/** Worker financial report filters and page, kept in the URL; the report is built on the server. */
export function useWorkerReportFilters() {
  const { filters, activeCount, update, reset, page, setPage } = useUrlFilters(FILTER_KEYS, {
    dateKeys: DATE_KEYS,
  });
  const reportFilters = useMemo<WorkerFinancialReportFilters>(
    () => activeFilters(filters),
    [filters],
  );
  const query = useMemo<WorkerFinancialReportQuery>(
    () => ({ ...reportFilters, page, pageSize: PAGINATION.defaultPageSize }),
    [reportFilters, page],
  );

  const updateFilters = useCallback(
    (changes: Partial<WorkerReportFilters>) => update(withConsistentWorkers(changes)),
    [update],
  );

  return {
    filters,
    reportFilters,
    query,
    activeCount,
    update: updateFilters,
    reset,
    setPage,
  };
}
