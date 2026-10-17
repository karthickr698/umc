import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterPanel } from '@/components/filters/filter-panel';
import { FilterSelect } from '@/components/filters/filter-select';
import type { DashboardFilters } from '../hooks/use-dashboard-filters';
import { useFilterOptions } from '../hooks/use-filter-options';

export interface DashboardFilterPanelProps {
  filters: DashboardFilters;
  activeCount: number;
  onChange: (changes: Partial<DashboardFilters>) => void;
  onReset: () => void;
}

export function DashboardFilterPanel({
  filters,
  activeCount,
  onChange,
  onReset,
}: DashboardFilterPanelProps) {
  const { sites, clients, workers, contractors } = useFilterOptions(filters.clientId);

  return (
    <FilterPanel activeCount={activeCount} onReset={onReset}>
      <DateRangeFilter value={{ from: filters.from, to: filters.to }} onChange={onChange} />
      <FilterSelect
        label="Client"
        allLabel="All clients"
        value={filters.clientId}
        source={clients}
        onChange={(clientId) => onChange({ clientId })}
      />
      <FilterSelect
        label="Site"
        allLabel={filters.clientId ? "All of client's sites" : 'All sites'}
        value={filters.siteId}
        source={sites}
        onChange={(siteId) => onChange({ siteId })}
      />
      <FilterSelect
        label="Worker"
        allLabel="All workers"
        value={filters.employeeId}
        source={workers}
        onChange={(employeeId) => onChange({ employeeId })}
      />
      <FilterSelect
        label="Contractor"
        allLabel="All contractors"
        value={filters.contractorId}
        source={contractors}
        onChange={(contractorId) => onChange({ contractorId })}
      />
    </FilterPanel>
  );
}
