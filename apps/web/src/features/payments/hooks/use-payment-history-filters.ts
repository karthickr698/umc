import { useCallback, useMemo } from 'react';
import { PAGINATION, WORKER_TYPES, type PaymentHistoryQuery } from '@umc/shared';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { parseWorkerKey } from '@/lib/worker-key';
import { isPaymentType } from '../lib/payment-options';

const FILTER_KEYS = ['from', 'to', 'siteId', 'worker', 'contractorId', 'paymentType'] as const;
const DATE_KEYS = ['from', 'to'] as const satisfies readonly PaymentHistoryFilterKey[];

export type PaymentHistoryFilterKey = (typeof FILTER_KEYS)[number];

/**
 * Every filter as a string; an empty string means "not filtered". `worker` holds a `workerKey`
 * so employees and contractor employees share one picker.
 */
export type PaymentHistoryFilters = Record<PaymentHistoryFilterKey, string>;

function workerQuery(
  key: string,
): Pick<PaymentHistoryQuery, 'employeeId' | 'contractorEmployeeId'> {
  const worker = parseWorkerKey(key);
  if (!worker) return {};
  return worker.workerType === WORKER_TYPES.EMPLOYEE
    ? { employeeId: worker.id }
    : { contractorEmployeeId: worker.id };
}

function toQuery(filters: PaymentHistoryFilters, page: number): PaymentHistoryQuery {
  const { from, to, siteId, worker, contractorId, paymentType } = filters;
  return {
    page,
    pageSize: PAGINATION.defaultPageSize,
    ...(from && { from }),
    ...(to && { to }),
    ...(siteId && { siteId }),
    ...workerQuery(worker),
    ...(contractorId && { contractorId }),
    ...(isPaymentType(paymentType) && { paymentType }),
  };
}

/** The worker list narrows to the chosen contractor, so a previous pick may no longer fit. */
export function normalizePaymentHistoryChanges(
  changes: Partial<PaymentHistoryFilters>,
): Partial<PaymentHistoryFilters> {
  return changes.contractorId !== undefined && changes.worker === undefined
    ? { ...changes, worker: '' }
    : changes;
}

/** Payment history filters and page, kept in the URL; filtering happens on the server. */
export function usePaymentHistoryFilters() {
  const { filters, activeCount, update, reset, page, setPage } = useUrlFilters(FILTER_KEYS, {
    dateKeys: DATE_KEYS,
  });
  const query = useMemo(() => toQuery(filters, page), [filters, page]);

  const updateFilters = useCallback(
    (changes: Partial<PaymentHistoryFilters>) => update(normalizePaymentHistoryChanges(changes)),
    [update],
  );

  return { filters, query, activeCount, update: updateFilters, reset, setPage };
}
