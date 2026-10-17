import { QueryClient, queryOptions } from '@tanstack/react-query';
import { ApiClientError, apiRequest } from './api-client';

const STALE_TIME_MS = 30_000;
const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: Error): boolean {
  // Bad filters, missing records and denied access won't succeed on a retry.
  if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: STALE_TIME_MS, retry: shouldRetry },
    },
  });
}

/** GET `path` (relative to the API base URL), cached under the path itself. */
export function apiQueryOptions<T>(path: string) {
  return queryOptions({
    queryKey: ['api', path] as const,
    queryFn: ({ signal }) => apiRequest<T>(path, { signal }),
  });
}
