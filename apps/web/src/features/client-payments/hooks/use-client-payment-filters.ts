import { useCallback, useMemo } from 'react';
import type { ClientPaymentFilterQuery } from '@umc/shared';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { isPaymentMode } from '@/lib/payment-modes';

const FILTER_KEYS = ['from', 'to', 'clientId', 'siteId', 'paymentMode'] as const;
const DATE_KEYS = ['from', 'to'] as const satisfies readonly ClientPaymentFilterKey[];

export type ClientPaymentFilterKey = (typeof FILTER_KEYS)[number];

/** Every filter as a string; an empty string means "not filtered". */
export type ClientPaymentFilters = Record<ClientPaymentFilterKey, string>;

function toQuery(filters: ClientPaymentFilters): ClientPaymentFilterQuery {
  const { from, to, clientId, siteId, paymentMode } = filters;
  return {
    ...(from && { from }),
    ...(to && { to }),
    ...(clientId && { clientId }),
    ...(siteId && { siteId }),
    ...(isPaymentMode(paymentMode) && { paymentMode }),
  };
}

/** Receipt filters and page, kept in the URL; shared by the list and its totals. */
export function useClientPaymentFilters() {
  const { filters, activeCount, update, reset, page, setPage } = useUrlFilters(FILTER_KEYS, {
    dateKeys: DATE_KEYS,
  });
  const query = useMemo(() => toQuery(filters), [filters]);

  const updateFilters = useCallback(
    (changes: Partial<ClientPaymentFilters>) => {
      // A site belongs to one client, so switching client drops a site that may not match.
      update(
        changes.clientId !== undefined && changes.siteId === undefined
          ? { ...changes, siteId: '' }
          : changes,
      );
    },
    [update],
  );

  return { filters, query, page, activeCount, update: updateFilters, reset, setPage };
}
