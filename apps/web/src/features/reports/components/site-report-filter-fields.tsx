import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterSelect } from '@/components/filters/filter-select';
import type { SelectOptionsSource } from '@/hooks/use-select-options';
import type { SiteReportFilters as Filters } from '../hooks/use-site-report-filters';

export interface SiteReportFilterFieldsProps {
  filters: Filters;
  sites: SelectOptionsSource;
  onChange: (changes: Partial<Filters>) => void;
}

export function SiteReportFilterFields({ filters, sites, onChange }: SiteReportFilterFieldsProps) {
  return (
    <>
      <DateRangeFilter value={{ from: filters.from, to: filters.to }} onChange={onChange} />
      <FilterSelect
        label="Site"
        allLabel="All sites"
        value={filters.siteId}
        source={sites}
        onChange={(siteId) => onChange({ siteId })}
      />
    </>
  );
}
