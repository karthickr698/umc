import { dateRangeChip, presentChips, selectChip } from '@/components/filters/filter-chips';
import { FilterPanel } from '@/components/filters/filter-panel';
import { staticOptions } from '@/components/filters/static-options';
import { useSiteOptions } from '@/hooks/use-record-options';
import type { SelectOptionsSource } from '@/hooks/use-select-options';
import { PAYMENT_MODE_OPTIONS } from '@/lib/payment-modes';
import {
  type ClientPaymentFilters as Filters,
  normalizeClientPaymentChanges,
} from '../hooks/use-client-payment-filters';
import { ClientPaymentFilterFields } from './client-payment-filter-fields';

const PAYMENT_MODES = staticOptions(PAYMENT_MODE_OPTIONS);

export interface ClientPaymentFiltersProps {
  filters: Filters;
  activeCount: number;
  clients: SelectOptionsSource;
  onChange: (changes: Partial<Filters>) => void;
  onReset: () => void;
}

export function ClientPaymentFilters({
  filters,
  activeCount,
  clients,
  onChange,
  onReset,
}: ClientPaymentFiltersProps) {
  const sites = useSiteOptions(filters.clientId || undefined);
  const chips = presentChips<keyof Filters>(
    dateRangeChip(filters),
    selectChip('clientId', 'Client', filters.clientId, clients),
    selectChip('siteId', 'Site', filters.siteId, sites),
    selectChip('paymentMode', 'Received by', filters.paymentMode, PAYMENT_MODES),
  );

  return (
    <FilterPanel
      filters={filters}
      activeCount={activeCount}
      chips={chips}
      onChange={onChange}
      onReset={onReset}
      normalize={normalizeClientPaymentChanges}
      renderFields={(values, change) => (
        <ClientPaymentFilterFields
          filters={values}
          clients={clients}
          paymentModes={PAYMENT_MODES}
          onChange={change}
        />
      )}
    />
  );
}
