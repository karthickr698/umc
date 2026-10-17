import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

export interface ListParams {
  page: number;
  search: string;
  status: string;
}

/** Page, search and status of a list page, kept in the URL so views can be shared and revisited. */
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1);
  const params: ListParams = {
    page,
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? '',
  };

  /** Changing the search or status starts again from the first page. */
  const update = useCallback(
    (changes: Partial<ListParams>) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        const resetPage = changes.search !== undefined || changes.status !== undefined;
        const merged = { ...changes, ...(resetPage && changes.page === undefined && { page: 1 }) };
        for (const [key, value] of Object.entries(merged)) {
          if (value === '' || value === 1) next.delete(key);
          else next.set(key, String(value));
        }
        return next;
      });
    },
    [setSearchParams],
  );

  return { params, update };
}
