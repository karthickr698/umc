import { useCallback } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiQueryOptions } from '@/lib/query-client';

export interface ApiQuery<T> {
  /** Last successful result; kept while a new path loads so lists don't flash empty. */
  data: T | undefined;
  error: unknown;
  loading: boolean;
  retry: () => void;
}

/** GETs `path` through the query cache and re-fetches whenever it changes. */
export function useApiQuery<T>(path: string): ApiQuery<T> {
  const { data, error, isFetching, refetch } = useQuery({
    ...apiQueryOptions<T>(path),
    placeholderData: keepPreviousData,
  });
  const retry = useCallback(() => void refetch(), [refetch]);

  return {
    data,
    error: isFetching ? undefined : (error ?? undefined),
    loading: isFetching,
    retry,
  };
}
