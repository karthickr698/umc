import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterPanel } from '@/components/filters/filter-panel';
import { FilterSelect } from '@/components/filters/filter-select';
import { staticOptions } from '@/components/filters/static-options';
import type { SelectOptionsSource } from '@/hooks/use-select-options';
import { PAYMENT_MODE_OPTIONS } from '@/lib/payment-modes';
import type { ClientPaymentFilters as Filters } from '../hooks/use-client-payment-filters';

const PAYMENT_MODES = staticOptions(PAYMENT_MODE_OPTIONS);

export interface ClientPaymentFiltersProps {
  filters: Filters;
  activeCount: number;
  clients: SelectOptionsSource;
  sites: SelectOptionsSource;
  onChange: (changes: Partial<Filters>) => void;
  onReset: () => void;
}

export function ClientPaymentFilters({
  filters,
  activeCount,
  clients,
  sites,
  onChange,
  onReset,
}: ClientPaymentFiltersProps) {
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
        allLabel="All sites"
        value={filters.siteId}
        source={sites}
        onChange={(siteId) => onChange({ siteId })}
      />
      <FilterSelect
        label="Received by"
        allLabel="Any way"
        value={filters.paymentMode}
        source={PAYMENT_MODES}
        onChange={(paymentMode) => onChange({ paymentMode })}
      />
    </FilterPanel>
  );
}
