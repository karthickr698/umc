import { useSyncExternalStore } from 'react';
import { getSharedFilters, type SharedFilters, subscribeSharedFilters } from '@/lib/shared-filters';

/** The filters that apply on every page; see `SHARED_FILTER_KEYS`. */
export function useSharedFilters(): SharedFilters {
  return useSyncExternalStore(subscribeSharedFilters, getSharedFilters);
}
