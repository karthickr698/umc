import { useMemo } from 'react';
import type { SiteFinancialReportFilters } from '@umc/shared';
import { activeFilters, useUrlFilters } from '@/hooks/use-url-filters';

const FILTER_KEYS = [
  'from',
  'to',
  'siteId',
] as const satisfies readonly (keyof SiteFinancialReportFilters)[];
const DATE_KEYS = ['from', 'to'] as const satisfies readonly SiteReportFilterKey[];

export type SiteReportFilterKey = (typeof FILTER_KEYS)[number];

/** Every filter as a string; an empty string means "not filtered". */
export type SiteReportFilters = Record<SiteReportFilterKey, string>;

/** Site financial report filters, kept in the URL; the report is built on the server. */
export function useSiteReportFilters() {
  const { filters, activeCount, update, reset } = useUrlFilters(FILTER_KEYS, {
    dateKeys: DATE_KEYS,
  });
  const reportFilters = useMemo<SiteFinancialReportFilters>(
    () => activeFilters(filters),
    [filters],
  );

  return { filters, reportFilters, activeCount, update, reset };
}
