import { useMemo } from 'react';
import type { WorkerSummaryListItem } from '@umc/shared';
import type { ApiQuery } from '@/hooks/use-api-query';
import { useAllPagesQuery } from '@/hooks/use-all-pages-query';
import { toPaymentWorkers, type PaymentWorker } from '../lib/payment-workers';
import { PAYMENTS_API } from '../payments-api';

/**
 * Workers with any assignment or payment at `siteId`, highest outstanding amount first. The API
 * only accepts a site-linked payment for a worker assigned there, so nobody else is offered.
 * Nothing is fetched until a site is chosen.
 */
export function useSiteWorkers(
  siteId: string,
  contractorNames: ReadonlyMap<string, string>,
): ApiQuery<PaymentWorker[]> {
  const summaries = useAllPagesQuery<WorkerSummaryListItem>(
    PAYMENTS_API.workerSummaries,
    { siteId },
    { enabled: siteId !== '' },
  );

  const data = useMemo(
    () => summaries.data && toPaymentWorkers(summaries.data, contractorNames),
    [summaries.data, contractorNames],
  );

  return { ...summaries, data };
}
