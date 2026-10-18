import { dateRangeChip, presentChips, selectChip } from '@/components/filters/filter-chips';
import { FilterPanel } from '@/components/filters/filter-panel';
import { useReportSiteOptions } from '../hooks/use-report-site-options';
import type { SiteReportFilters as Filters } from '../hooks/use-site-report-filters';
import { SiteReportFilterFields } from './site-report-filter-fields';

export interface SiteReportFiltersProps {
  filters: Filters;
  activeCount: number;
  onChange: (changes: Partial<Filters>) => void;
  onReset: () => void;
}

export function SiteReportFilters({
  filters,
  activeCount,
  onChange,
  onReset,
}: SiteReportFiltersProps) {
  const sites = useReportSiteOptions();
  const chips = presentChips<keyof Filters>(
    dateRangeChip(filters),
    selectChip('siteId', 'Site', filters.siteId, sites),
  );

  return (
    <FilterPanel
      filters={filters}
      activeCount={activeCount}
      chips={chips}
      onChange={onChange}
      onReset={onReset}
      renderFields={(values, change) => (
        <SiteReportFilterFields filters={values} sites={sites} onChange={change} />
      )}
    />
  );
}
