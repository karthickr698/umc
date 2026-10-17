import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterPanel } from '@/components/filters/filter-panel';
import { FilterSelect } from '@/components/filters/filter-select';
import type { PaymentHistoryFilters as Filters } from '../hooks/use-payment-history-filters';
import { usePaymentHistoryOptions } from '../hooks/use-payment-history-options';

export interface PaymentHistoryFiltersProps {
  filters: Filters;
  activeCount: number;
  onChange: (changes: Partial<Filters>) => void;
  onReset: () => void;
}

export function PaymentHistoryFilters({
  filters,
  activeCount,
  onChange,
  onReset,
}: PaymentHistoryFiltersProps) {
  const { sites, workers, contractors, paymentTypes } = usePaymentHistoryOptions(
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
        label="Contractor"
        allLabel="All contractors"
        value={filters.contractorId}
        source={contractors}
        onChange={(contractorId) => onChange({ contractorId })}
      />
      <FilterSelect
        label="Worker"
        allLabel={filters.contractorId ? "All of contractor's workers" : 'All workers'}
        value={filters.worker}
        source={workers}
        onChange={(worker) => onChange({ worker })}
      />
      <FilterSelect
        label="Payment type"
        allLabel="All types"
        value={filters.paymentType}
        source={paymentTypes}
        onChange={(paymentType) => onChange({ paymentType })}
      />
    </FilterPanel>
  );
}
