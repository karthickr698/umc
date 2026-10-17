import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterPanel } from '@/components/filters/filter-panel';
import { FilterSelect } from '@/components/filters/filter-select';
import { useReportSiteOptions } from '../hooks/use-report-site-options';
import type { SiteReportFilters as Filters } from '../hooks/use-site-report-filters';

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

  return (
    <FilterPanel activeCount={activeCount} onReset={onReset}>
      <DateRangeFilter value={{ from: filters.from, to: filters.to }} onChange={onChange} />
      <FilterSelect
        label="Site"
        allLabel="All sites"
        value={filters.siteId}
        source={sites}
        onChange={(siteId) => onChange({ siteId })}
      />
    </FilterPanel>
  );
}
