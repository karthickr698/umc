import { EXPENSE_CATEGORIES } from '@umc/shared';
import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterPanel } from '@/components/filters/filter-panel';
import { FilterSelect } from '@/components/filters/filter-select';
import { staticOptions } from '@/components/filters/static-options';
import type { SelectOptionsSource } from '@/hooks/use-select-options';
import { enumOptions } from '@/lib/select-options';
import type { ExpenseFilters as Filters } from '../hooks/use-expense-filters';

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
        label="Spent on"
        allLabel="Everything"
        value={filters.category}
        source={CATEGORIES}
        onChange={(category) => onChange({ category })}
      />
    </FilterPanel>
  );
}
