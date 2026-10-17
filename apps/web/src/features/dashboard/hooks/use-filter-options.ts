import { useSelectOptions } from '@/hooks/use-select-options';
import { employeeOption, namedOption } from '@/lib/select-options';
import { siteOption } from '@/lib/sites';
import { DASHBOARD_API } from '../dashboard-api';

/** Choices for the dashboard's site, client, worker and contractor filters. */
export function useFilterOptions(clientId: string) {
  return {
    sites: useSelectOptions(DASHBOARD_API.siteOptions(clientId || undefined), siteOption),
    clients: useSelectOptions(DASHBOARD_API.clientOptions(), namedOption),
    workers: useSelectOptions(DASHBOARD_API.employeeOptions(), employeeOption),
    contractors: useSelectOptions(DASHBOARD_API.contractorOptions(), namedOption),
  };
}
