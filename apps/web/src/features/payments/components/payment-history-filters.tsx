import { dateRangeChip, presentChips, selectChip } from '@/components/filters/filter-chips';
import { FilterPanel } from '@/components/filters/filter-panel';
import {
  normalizePaymentHistoryChanges,
  type PaymentHistoryFilters as Filters,
} from '../hooks/use-payment-history-filters';
import { usePaymentHistoryOptions } from '../hooks/use-payment-history-options';
import { PaymentHistoryFilterFields } from './payment-history-filter-fields';

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
  const chips = presentChips<keyof Filters>(
    dateRangeChip(filters),
    selectChip('siteId', 'Site', filters.siteId, sites),
    selectChip('contractorId', 'Contractor', filters.contractorId, contractors),
    selectChip('worker', 'Worker', filters.worker, workers),
    selectChip('paymentType', 'Type', filters.paymentType, paymentTypes),
  );

  return (
    <FilterPanel
      filters={filters}
      activeCount={activeCount}
      chips={chips}
      onChange={onChange}
      onReset={onReset}
      normalize={normalizePaymentHistoryChanges}
      renderFields={(values, change) => (
        <PaymentHistoryFilterFields filters={values} onChange={change} />
      )}
    />
  );
}
