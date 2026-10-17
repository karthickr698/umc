import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PAGINATION, type Paginated } from '@umc/shared';
import { apiRequest } from '@/lib/api-client';
import { withQuery } from '@/utils/query-string';
import type { ApiQuery } from './use-api-query';

type QueryParams = Readonly<Record<string, string | number | undefined>>;

/** Without `params` this is a prefix matching every filter of `path`, e.g. for invalidation. */
export function allPagesQueryKey(path: string, params?: QueryParams) {
  return params ? (['api-all', path, params] as const) : (['api-all', path] as const);
}

/** The first page tells how many there are; the rest are then fetched in parallel. */
async function fetchAllPages<T>(
  path: string,
  params: QueryParams,
  signal: AbortSignal,
): Promise<T[]> {
  const fetchPage = (page: number) =>
    apiRequest<Paginated<T>>(
      withQuery(path, { ...params, page, pageSize: PAGINATION.maxPageSize }),
      { signal },
    );

  const first = await fetchPage(PAGINATION.defaultPage);
  const remaining = Array.from(
    { length: Math.max(first.meta.totalPages - PAGINATION.defaultPage, 0) },
    (_, index) => fetchPage(PAGINATION.defaultPage + index + 1),
  );
  const rest = await Promise.all(remaining);
  return [first, ...rest].flatMap((result) => result.items);
}

export interface AllPagesQueryOptions {
  /** When `false` nothing is fetched and `data` stays `undefined`. Defaults to `true`. */
  enabled?: boolean;
}

/**
 * GETs every page of a paginated list. Unlike `useApiQuery`, the previous result is not kept
 * while a different `path` loads, so callers never act on another filter's items.
 */
export function useAllPagesQuery<T>(
  path: string,
  params: QueryParams = {},
  { enabled = true }: AllPagesQueryOptions = {},
): ApiQuery<T[]> {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: allPagesQueryKey(path, params),
    queryFn: ({ signal }) => fetchAllPages<T>(path, params, signal),
    enabled,
  });
  const retry = useCallback(() => void refetch(), [refetch]);

  return {
    data,
    error: isFetching ? undefined : (error ?? undefined),
    loading: isFetching,
    retry,
  };
}
