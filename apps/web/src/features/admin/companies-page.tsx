import { Link } from 'react-router';
import { COMPANY_STATUSES, type AdminCompanySummaryDto, type Paginated } from '@umc/shared';
import { Pagination } from '@/components/data/pagination';
import { QueryResult } from '@/components/data/query-result';
import { StatusBadge } from '@/components/data/status-badge';
import { ListFilters } from '@/components/filters/list-filters';
import { PageContainer } from '@/components/layout/page-container';
import { adminCompanyPath } from '@/config/routes';
import { useApiQuery } from '@/hooks/use-api-query';
import { useListParams } from '@/hooks/use-list-params';
import { formatDate } from '@/utils/format';
import { ADMIN_API } from './admin-api';
import { ContactList } from './contact-list';

const STATUSES = Object.values(COMPANY_STATUSES);

export function CompaniesPage() {
  const { params, update } = useListParams();
  const query = useApiQuery<Paginated<AdminCompanySummaryDto>>(
    ADMIN_API.companies({
      page: params.page,
      search: params.search || undefined,
      status: STATUSES.find((status) => status === params.status),
    }),
  );

  return (
    <PageContainer title="Companies" description="Every company on the platform and its owners.">
      <div className="stack">
        <ListFilters
          key={params.search}
          params={params}
          statuses={STATUSES}
          searchLabel="Company name"
          onChange={update}
        />
        <QueryResult query={query}>
          {(result) => (
            <div className="card table-card" aria-busy={query.loading}>
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th scope="col">Company</th>
                      <th scope="col">Owners</th>
                      <th scope="col" className="table__numeric">
                        Users
                      </th>
                      <th scope="col" className="table__numeric">
                        Sites
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((company) => (
                      <tr key={company.id}>
                        <td>
                          <Link className="text-link" to={adminCompanyPath(company.id)}>
                            {company.name}
                          </Link>
                        </td>
                        <td>
                          <ContactList users={company.owners} emptyMessage="No owner" />
                        </td>
                        <td className="table__numeric">{company.userCount}</td>
                        <td className="table__numeric">{company.siteCount}</td>
                        <td>
                          <StatusBadge status={company.status} />
                        </td>
                        <td>{formatDate(company.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.items.length === 0 && <p className="table-message">No companies found.</p>}
              </div>
              <Pagination
                meta={result.meta}
                onPageChange={(page) => update({ page })}
                disabled={query.loading}
              />
            </div>
          )}
        </QueryResult>
      </div>
    </PageContainer>
  );
}
