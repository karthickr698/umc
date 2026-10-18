import { Construction } from 'lucide-react';
import { useMemo } from 'react';
import { SITE_STATUSES, type SiteDto } from '@umc/shared';
import type { DataTableColumn } from '@/components/data/data-table';
import { StackedCell } from '@/components/data/stacked-cell';
import { StatusBadge } from '@/components/data/status-badge';
import { ResourceListPage } from '@/components/pages/resource-list-page';
import { useCan } from '@/hooks/use-can';
import { RESOURCE_API } from '@/lib/resource-api';
import { siteLabel, siteStartDay } from '@/lib/sites';
import { addressLocality, formatCalendarDate } from '@/utils/format';
import { SiteDetails } from './components/site-details';
import { SiteForm } from './components/site-form';
import { useClientOptions, useOptionLabels } from '@/hooks/use-record-options';

const STATUSES = Object.values(SITE_STATUSES);

function siteColumns(clientNames: ReadonlyMap<string, string>): DataTableColumn<SiteDto>[] {
  return [
    {
      id: 'name',
      header: 'Site',
      render: (site) => <StackedCell primary={site.name} secondary={site.code} />,
    },
    { id: 'client', header: 'Client', render: (site) => clientNames.get(site.clientId) ?? '—' },
    {
      id: 'location',
      header: 'Location',
      render: (site) => addressLocality(site.address) || '—',
    },
    {
      id: 'status',
      header: 'Status',
      mobile: 'aside',
      render: (site) => <StatusBadge status={site.status} />,
    },
    {
      id: 'startDate',
      header: 'Start date',
      render: (site) => {
        const day = siteStartDay(site);
        return day ? formatCalendarDate(day) : '—';
      },
    },
  ];
}

export function SitesPage() {
  const canManage = useCan('manageSites');
  const clientNames = useOptionLabels(useClientOptions());
  const columns = useMemo(() => siteColumns(clientNames), [clientNames]);

  return (
    <ResourceListPage<SiteDto>
      title="Sites"
      description="Construction sites, their client, status and start date."
      noun="site"
      api={RESOURCE_API.sites}
      statuses={STATUSES}
      searchLabel="Name or code"
      columns={columns}
      canManage={canManage}
      itemName={siteLabel}
      intro={{
        icon: Construction,
        title: 'Add your first site',
        message:
          'A site is a construction project for one of your clients. Work, payments and expenses are all recorded against a site.',
      }}
      Form={SiteForm}
      Details={SiteDetails}
    />
  );
}
