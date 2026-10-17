import { useMemo } from 'react';
import type { ContractorDto, SiteDto } from '@umc/shared';
import type { SelectOption } from '@/components/forms/select-field';
import type { ApiQuery } from '@/hooks/use-api-query';
import { useAllPagesQuery } from '@/hooks/use-all-pages-query';
import { isAssignableSite, siteLabel, toSiteOptions } from '@/lib/sites';
import { humanizeEnum } from '@/utils/format';
import { PAYMENTS_API } from '../payments-api';

export interface PaymentReference {
  /** Active and planned sites first, then the rest (labelled with their status), each by name. */
  siteOptions: SelectOption[];
  sitesById: ReadonlyMap<string, SiteDto>;
  contractorNames: ReadonlyMap<string, string>;
}

function buildReference(sites: SiteDto[], contractors: ContractorDto[]): PaymentReference {
  const otherSites = sites
    .filter((site) => !isAssignableSite(site))
    .map((site) => ({
      value: site.id,
      label: `${siteLabel(site)} · ${humanizeEnum(site.status)}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    siteOptions: [...toSiteOptions(sites.filter(isAssignableSite)), ...otherSites],
    sitesById: new Map(sites.map((site) => [site.id, site])),
    contractorNames: new Map(contractors.map((contractor) => [contractor.id, contractor.name])),
  };
}

/**
 * Sites and contractor names. Contractor names only decorate worker rows, so failing to load them
 * never blocks payment entry.
 */
export function usePaymentReference(): ApiQuery<PaymentReference> {
  const sites = useAllPagesQuery<SiteDto>(PAYMENTS_API.sites);
  const contractors = useAllPagesQuery<ContractorDto>(PAYMENTS_API.contractors);
  const contractorsSettled = contractors.data !== undefined || contractors.error !== undefined;

  const data = useMemo(
    () =>
      sites.data && contractorsSettled
        ? buildReference(sites.data, contractors.data ?? [])
        : undefined,
    [sites.data, contractors.data, contractorsSettled],
  );

  return {
    data,
    error: sites.error,
    loading: sites.loading || !contractorsSettled,
    retry: sites.retry,
  };
}
