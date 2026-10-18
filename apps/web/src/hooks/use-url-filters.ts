import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { PAGINATION } from '@umc/shared';
import { clearSharedFilters, isSharedFilterKey, setSharedFilters } from '@/lib/shared-filters';
import { isCalendarDate } from '@/utils/calendar-date';
import { useSharedFilters } from './use-shared-filters';

const PAGE_KEY = 'page';
const NO_KEYS: readonly never[] = [];

export interface UrlFilterOptions<K extends string> {
  /** Keys holding `YYYY-MM-DD` days; malformed values read as "not filtered". */
  dateKeys?: readonly K[];
}

/** Only the filters that are set, e.g. to send as an API query. */
export function activeFilters<K extends string>(
  filters: Readonly<Record<K, string>>,
): Partial<Record<K, string>> {
  return Object.fromEntries(
    Object.entries<string>(filters).filter(([, value]) => value !== ''),
  ) as Partial<Record<K, string>>;
}

function readPage(searchParams: URLSearchParams): number {
  const page = Number.parseInt(searchParams.get(PAGE_KEY) ?? '', 10);
  return Number.isInteger(page) && page > PAGINATION.defaultPage ? page : PAGINATION.defaultPage;
}

/**
 * String filters and the list page kept in the URL, so a filtered view can be bookmarked or
 * shared. An empty string means "not filtered"; changing any filter returns to the first page.
 * Shared keys (see `SHARED_FILTER_KEYS`) missing from the URL fall back to the filters picked on
 * other pages, and every change to them is shared in turn. Clearing all filters clears the shared
 * ones too. Pass `keys` and `dateKeys` as stable (module-level) arrays.
 */
export function useUrlFilters<K extends string>(
  keys: readonly K[],
  { dateKeys = NO_KEYS }: UrlFilterOptions<K> = {},
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const shared = useSharedFilters();

  const filters = useMemo(() => {
    const entries = keys.map((key) => {
      const fallback = isSharedFilterKey(key) ? shared[key] : undefined;
      const value = (searchParams.get(key) ?? fallback ?? '').trim();
      // Hand-edited URLs with malformed dates fall back to "no limit" instead of failing requests.
      return [key, dateKeys.includes(key) && !isCalendarDate(value) ? '' : value];
    });
    return Object.fromEntries(entries) as Record<K, string>;
  }, [searchParams, shared, keys, dateKeys]);

  // A shared link or the back button can bring filters in the URL; other pages follow them.
  useEffect(() => {
    const fromUrl: Record<string, string> = {};
    for (const key of keys) {
      const value = searchParams.get(key);
      if (value !== null && isSharedFilterKey(key)) fromUrl[key] = value;
    }
    setSharedFilters(fromUrl);
  }, [searchParams, keys]);

  const activeCount = keys.filter((key) => filters[key] !== '').length;
  const page = readPage(searchParams);

  const update = useCallback(
    (changes: Partial<Record<K, string>>) => {
      setSharedFilters(changes);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries<string | undefined>(changes)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          next.delete(PAGE_KEY);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const reset = useCallback(() => {
    clearSharedFilters();
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        for (const key of [...keys, PAGE_KEY]) next.delete(key);
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams, keys]);

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (nextPage > PAGINATION.defaultPage) next.set(PAGE_KEY, String(nextPage));
        else next.delete(PAGE_KEY);
        return next;
      });
    },
    [setSearchParams],
  );

  return { filters, activeCount, update, reset, page, setPage };
}
