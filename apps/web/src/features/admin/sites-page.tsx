import { SITE_STATUSES, type AdminSiteDto, type Paginated } from '@umc/shared';
import { QueryResult } from '@/components/data/query-result';
import { ListFilters } from '@/components/filters/list-filters';
import { PageContainer } from '@/components/layout/page-container';
import { useApiQuery } from '@/hooks/use-api-query';
import { useListParams } from '@/hooks/use-list-params';
import { ADMIN_API } from './admin-api';
import { SitesTable } from './sites-table';

const STATUSES = Object.values(SITE_STATUSES);

export function SitesPage() {
  const { params, update } = useListParams();
  const query = useApiQuery<Paginated<AdminSiteDto>>(
    ADMIN_API.sites({
      page: params.page,
      search: params.search || undefined,
      status: STATUSES.find((status) => status === params.status),
    }),
  );

  return (
    <PageContainer title="All sites" description="Construction sites across every company.">
      <div className="stack">
        <ListFilters
          key={params.search}
          params={params}
          statuses={STATUSES}
          searchLabel="Site name or code"
          onChange={update}
        />
        <QueryResult query={query}>
          {(result) => (
            <SitesTable
              result={result}
              loading={query.loading}
              onPageChange={(page) => update({ page })}
            />
          )}
        </QueryResult>
      </div>
    </PageContainer>
  );
}
