import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterSelect } from '@/components/filters/filter-select';
import { type DashboardFilters } from '../hooks/use-dashboard-filters';
import { useFilterOptions } from '../hooks/use-filter-options';

export interface DashboardFilterFieldsProps {
  filters: DashboardFilters;
  onChange: (changes: Partial<DashboardFilters>) => void;
}

export function DashboardFilterFields({ filters, onChange }: DashboardFilterFieldsProps) {
  const { sites, clients, workers, contractors } = useFilterOptions(filters.clientId);

  return (
    <>
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
    </>
  );
}
