import { useMemo } from 'react';
import type { ContractorDto, SiteDto, WorkerSummaryListItem } from '@umc/shared';
import { staticOptions } from '@/components/filters/static-options';
import type { SelectOption } from '@/components/forms/select-field';
import { useAllPagesQuery } from '@/hooks/use-all-pages-query';
import {
  byOptionLabel,
  toOptionsSource,
  useAllPagesSelectOptions,
} from '@/hooks/use-select-options';
import { namedOption } from '@/lib/select-options';
import { toSiteOptions } from '@/lib/sites';
import { workerKey } from '@/lib/worker-key';
import { PAYMENT_TYPE_OPTIONS } from '../lib/payment-options';
import { PAYMENTS_API } from '../payments-api';

const PAYMENT_TYPE_SOURCE = staticOptions(PAYMENT_TYPE_OPTIONS);

/** Everyone ever assigned or paid; with `contractorId`, only that contractor's workers. */
function workerOptions(
  summaries: readonly WorkerSummaryListItem[],
  contractorId: string,
): SelectOption[] {
  return summaries
    .filter(({ worker }) => !contractorId || worker.contractorId === contractorId)
    .map(({ worker }) => ({
      value: workerKey(worker.workerType, worker.id),
      label: `${worker.name} (${worker.employeeCode})`,
    }))
    .sort(byOptionLabel);
}

/** Choices for the payment history's site, worker, contractor and payment type filters. */
export function usePaymentHistoryOptions(contractorId: string) {
  const sites = useAllPagesQuery<SiteDto>(PAYMENTS_API.sites);
  const contractors = useAllPagesSelectOptions<ContractorDto>(
    PAYMENTS_API.contractors,
    namedOption,
  );
  const workers = useAllPagesQuery<WorkerSummaryListItem>(PAYMENTS_API.workerSummaries);

  const siteChoices = useMemo(() => toSiteOptions(sites.data ?? []), [sites.data]);
  const workerChoices = useMemo(
    () => workerOptions(workers.data ?? [], contractorId),
    [workers.data, contractorId],
  );

  return {
    sites: toOptionsSource(sites, siteChoices),
    contractors,
    workers: toOptionsSource(workers, workerChoices),
    paymentTypes: PAYMENT_TYPE_SOURCE,
  };
}
