import { dateRangeChip, presentChips, selectChip } from '@/components/filters/filter-chips';
import { FilterPanel } from '@/components/filters/filter-panel';
import {
  withConsistentWorkers,
  type WorkerReportFilters as Filters,
} from '../hooks/use-worker-report-filters';
import { useWorkerReportOptions } from '../hooks/use-worker-report-options';
import { WorkerReportFilterFields } from './worker-report-filter-fields';

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
  const chips = presentChips<keyof Filters>(
    dateRangeChip(filters),
    selectChip('siteId', 'Site', filters.siteId, sites),
    selectChip('employeeId', 'Employee', filters.employeeId, employees),
    selectChip('contractorId', 'Contractor', filters.contractorId, contractors),
    selectChip(
      'contractorEmployeeId',
      'Contractor employee',
      filters.contractorEmployeeId,
      contractorEmployees,
    ),
  );

  return (
    <FilterPanel
      filters={filters}
      activeCount={activeCount}
      chips={chips}
      onChange={onChange}
      onReset={onReset}
      normalize={withConsistentWorkers}
      renderFields={(values, change) => (
        <WorkerReportFilterFields filters={values} onChange={change} />
      )}
    />
  );
}
