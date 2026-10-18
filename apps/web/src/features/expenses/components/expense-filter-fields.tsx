import { DateRangeFilter } from '@/components/filters/date-range-filter';
import { FilterSelect } from '@/components/filters/filter-select';
import type { SelectOptionsSource } from '@/hooks/use-select-options';
import type { ExpenseFilters as Filters } from '../hooks/use-expense-filters';

export interface ExpenseFilterFieldsProps {
  filters: Filters;
  sites: SelectOptionsSource;
  categories: SelectOptionsSource;
  onChange: (changes: Partial<Filters>) => void;
}

export function ExpenseFilterFields({
  filters,
  sites,
  categories,
  onChange,
}: ExpenseFilterFieldsProps) {
  return (
    <>
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
        source={categories}
        onChange={(category) => onChange({ category })}
      />
    </>
  );
}
