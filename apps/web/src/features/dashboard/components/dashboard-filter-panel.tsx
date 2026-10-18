import { dateRangeChip, presentChips, selectChip } from '@/components/filters/filter-chips';
import { FilterPanel } from '@/components/filters/filter-panel';
import { type DashboardFilters, normalizeDashboardChanges } from '../hooks/use-dashboard-filters';
import { useFilterOptions } from '../hooks/use-filter-options';
import { DashboardFilterFields } from './dashboard-filter-fields';

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
  const chips = presentChips<keyof DashboardFilters>(
    dateRangeChip(filters),
    selectChip('clientId', 'Client', filters.clientId, clients),
    selectChip('siteId', 'Site', filters.siteId, sites),
    selectChip('employeeId', 'Worker', filters.employeeId, workers),
    selectChip('contractorId', 'Contractor', filters.contractorId, contractors),
  );

  return (
    <FilterPanel
      filters={filters}
      activeCount={activeCount}
      chips={chips}
      onChange={onChange}
      onReset={onReset}
      normalize={normalizeDashboardChanges}
      renderFields={(values, change) => (
        <DashboardFilterFields filters={values} onChange={change} />
      )}
    />
  );
}
