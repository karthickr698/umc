import { useMutation, useQueryClient, type Query } from '@tanstack/react-query';
import { API_ROUTES } from '@umc/shared';
import { createPayment, PAYMENTS_API } from '../payments-api';

/** Cached reads whose totals include worker payments. */
const AFFECTED_PATH_PREFIXES = [
  PAYMENTS_API.payments,
  PAYMENTS_API.workerSummaries,
  API_ROUTES.dashboard.base,
];

function isAffected({ queryKey }: Query): boolean {
  const path = queryKey[1];
  return typeof path === 'string' && AFFECTED_PATH_PREFIXES.some((p) => path.startsWith(p));
}

/** Creates a payment, then refreshes balances, payment lists and the dashboard. */
export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    // Not awaited, so the success screen shows without waiting for the refetches.
    onSuccess: () => void queryClient.invalidateQueries({ predicate: isAffected }),
  });
}
