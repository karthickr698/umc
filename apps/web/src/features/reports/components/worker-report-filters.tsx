import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterPanel } from '@/components/filters/filter-panel';
import { FilterSelect } from '@/components/filters/filter-select';
import type { WorkerReportFilters as Filters } from '../hooks/use-worker-report-filters';
import { useWorkerReportOptions } from '../hooks/use-worker-report-options';

export interface WorkerReportFiltersProps {
  filters: Filters;
  activeCount: number;
  onChange: (changes: Partial<Filters>) => void;
  onReset: () => void;
}

export function WorkerReportFilters({
  filters,
  activeCount,
  onChange,
  onReset,
}: WorkerReportFiltersProps) {
  const { sites, employees, contractors, contractorEmployees } = useWorkerReportOptions(
    filters.contractorId,
  );

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
      <FilterSelect
        label="Employee"
        allLabel="All employees"
        value={filters.employeeId}
        source={employees}
        onChange={(employeeId) => onChange({ employeeId })}
      />
      <FilterSelect
        label="Contractor"
        allLabel="All contractors"
        value={filters.contractorId}
        source={contractors}
        onChange={(contractorId) => onChange({ contractorId })}
      />
      <FilterSelect
        label="Contractor employee"
        allLabel={
          filters.contractorId ? "All of contractor's employees" : 'All contractor employees'
        }
        value={filters.contractorEmployeeId}
        source={contractorEmployees}
        onChange={(contractorEmployeeId) => onChange({ contractorEmployeeId })}
      />
    </FilterPanel>
  );
}
