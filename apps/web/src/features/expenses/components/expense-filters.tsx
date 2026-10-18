import { EXPENSE_CATEGORIES } from '@umc/shared';
import { dateRangeChip, presentChips, selectChip } from '@/components/filters/filter-chips';
import { FilterPanel } from '@/components/filters/filter-panel';
import { staticOptions } from '@/components/filters/static-options';
import type { SelectOptionsSource } from '@/hooks/use-select-options';
import { enumOptions } from '@/lib/select-options';
import type { ExpenseFilters as Filters } from '../hooks/use-expense-filters';
import { ExpenseFilterFields } from './expense-filter-fields';

const CATEGORIES = staticOptions(enumOptions(EXPENSE_CATEGORIES));

export interface ExpenseFiltersProps {
  filters: Filters;
  activeCount: number;
  sites: SelectOptionsSource;
  onChange: (changes: Partial<Filters>) => void;
  onReset: () => void;
}

export function ExpenseFilters({
  filters,
  activeCount,
  sites,
  onChange,
  onReset,
}: ExpenseFiltersProps) {
  const chips = presentChips<keyof Filters>(
    dateRangeChip(filters),
    selectChip('siteId', 'Site', filters.siteId, sites),
    selectChip('category', 'Spent on', filters.category, CATEGORIES),
  );

  return (
    <FilterPanel
      filters={filters}
      activeCount={activeCount}
      chips={chips}
      onChange={onChange}
      onReset={onReset}
      renderFields={(values, change) => (
        <ExpenseFilterFields
          filters={values}
          sites={sites}
          categories={CATEGORIES}
          onChange={change}
        />
      )}
    />
  );
}
