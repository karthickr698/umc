import { useCallback, useMemo } from 'react';
import type { DashboardSummaryQuery } from '@umc/shared';
import { useUrlFilters } from '@/hooks/use-url-filters';

const FILTER_KEYS = [
  'from',
  'to',
  'siteId',
  'clientId',
  'employeeId',
  'contractorId',
] as const satisfies readonly (keyof DashboardSummaryQuery)[];

const DATE_KEYS = ['from', 'to'] as const satisfies readonly DashboardFilterKey[];

export type DashboardFilterKey = (typeof FILTER_KEYS)[number];

/** Every filter as a string; an empty string means "not filtered". */
export type DashboardFilters = Record<DashboardFilterKey, string>;

function toQuery(filters: DashboardFilters): DashboardSummaryQuery {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
}

/** Dashboard filters kept in the URL, so a filtered view can be bookmarked or shared. */
export function useDashboardFilters() {
  const { filters, activeCount, update, reset } = useUrlFilters(FILTER_KEYS, {
    dateKeys: DATE_KEYS,
  });
  const query = useMemo(() => toQuery(filters), [filters]);

  const updateFilters = useCallback(
    (changes: Partial<DashboardFilters>) => {
      // A site belongs to one client, so switching client drops a site that may not match.
      update(
        changes.clientId !== undefined && changes.siteId === undefined
          ? { ...changes, siteId: '' }
          : changes,
      );
    },
    [update],
  );

  return { filters, query, activeCount, update: updateFilters, reset };
}
