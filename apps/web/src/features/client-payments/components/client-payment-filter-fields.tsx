import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterSelect } from '@/components/filters/filter-select';
import { useSiteOptions } from '@/hooks/use-record-options';
import type { SelectOptionsSource } from '@/hooks/use-select-options';
import type { ClientPaymentFilters as Filters } from '../hooks/use-client-payment-filters';

export interface ClientPaymentFilterFieldsProps {
  filters: Filters;
  clients: SelectOptionsSource;
  paymentModes: SelectOptionsSource;
  onChange: (changes: Partial<Filters>) => void;
}

export function ClientPaymentFilterFields({
  filters,
  clients,
  paymentModes,
  onChange,
}: ClientPaymentFilterFieldsProps) {
  const sites = useSiteOptions(filters.clientId || undefined);

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
        allLabel="All sites"
        value={filters.siteId}
        source={sites}
        onChange={(siteId) => onChange({ siteId })}
      />
      <FilterSelect
        label="Received by"
        allLabel="Any way"
        value={filters.paymentMode}
        source={paymentModes}
        onChange={(paymentMode) => onChange({ paymentMode })}
      />
    </>
  );
}
