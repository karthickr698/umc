import { useMemo } from 'react';
import { EXPENSE_CATEGORIES, type ListExpensesQuery } from '@umc/shared';
import { useUrlFilters } from '@/hooks/use-url-filters';

const FILTER_KEYS = ['from', 'to', 'siteId', 'category'] as const;
const DATE_KEYS = ['from', 'to'] as const satisfies readonly ExpenseFilterKey[];

export type ExpenseFilterKey = (typeof FILTER_KEYS)[number];

/** Every filter as a string; an empty string means "not filtered". */
export type ExpenseFilters = Record<ExpenseFilterKey, string>;

function toQuery({ from, to, siteId, category }: ExpenseFilters, page: number): ListExpensesQuery {
  return {
    page,
    ...(from && { from }),
    ...(to && { to }),
    ...(siteId && { siteId }),
    category: Object.values(EXPENSE_CATEGORIES).find((value) => value === category),
  };
}

/** Expense list filters and page, kept in the URL; filtering happens on the server. */
export function useExpenseFilters() {
  const { filters, activeCount, update, reset, page, setPage } = useUrlFilters(FILTER_KEYS, {
    dateKeys: DATE_KEYS,
  });
  const query = useMemo(() => toQuery(filters, page), [filters, page]);
  return { filters, query, activeCount, update, reset, setPage };
}
