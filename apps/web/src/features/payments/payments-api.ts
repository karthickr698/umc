import {
  API_ROUTES,
  type CreatePaymentRequest,
  type PaymentDto,
  type PaymentHistoryQuery,
} from '@umc/shared';
import { apiRequest } from '@/lib/api-client';
import { withQuery } from '@/utils/query-string';

const { payments, sites, contractors, workerSummaries } = API_ROUTES;

/** API paths used by the payments pages, relative to the API base URL. */
export const PAYMENTS_API = {
  payments: payments.base,
  history: (query: PaymentHistoryQuery) =>
    withQuery(`${payments.base}${payments.history}`, { ...query }),
  sites: sites.base,
  contractors: contractors.base,
  workerSummaries: workerSummaries.base,
};

export function createPayment(request: CreatePaymentRequest): Promise<PaymentDto> {
  return apiRequest(PAYMENTS_API.payments, { method: 'POST', body: JSON.stringify(request) });
}
