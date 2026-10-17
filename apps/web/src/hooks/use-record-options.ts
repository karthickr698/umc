import { useMemo } from 'react';
import type { ClientDto, SiteDto } from '@umc/shared';
import { RESOURCE_API } from '@/lib/resource-api';
import { namedOption } from '@/lib/select-options';
import { siteOption } from '@/lib/sites';
import { useAllPagesSelectOptions, type SelectOptionsSource } from './use-select-options';

/** Every client of the company as select options. */
export function useClientOptions(): SelectOptionsSource {
  return useAllPagesSelectOptions<ClientDto>(RESOURCE_API.clients.base, namedOption);
}

/** Every site of the company as select options; with `clientId`, only that client's sites. */
export function useSiteOptions(clientId?: string): SelectOptionsSource {
  return useAllPagesSelectOptions<SiteDto>(
    RESOURCE_API.sites.base,
    siteOption,
    clientId ? { clientId } : undefined,
  );
}

/** Option labels by value, e.g. to show a site's name in a table from its id. */
export function useOptionLabels({ options }: SelectOptionsSource): ReadonlyMap<string, string> {
  return useMemo(() => new Map(options.map(({ value, label }) => [value, label])), [options]);
}
