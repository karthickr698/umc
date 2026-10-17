import { useState } from 'react';
import { useParams } from 'react-router';
import type { AdminCompanyDetailDto, AdminSiteDto, Paginated } from '@umc/shared';
import { DescriptionList } from '@/components/data/description-list';
import { QueryResult } from '@/components/data/query-result';
import { StatusBadge } from '@/components/data/status-badge';
import { PageContainer } from '@/components/layout/page-container';
import { useApiQuery } from '@/hooks/use-api-query';
import { formatAddress, formatDate, humanizeEnum } from '@/utils/format';
import { ADMIN_API } from './admin-api';
import { ContactList } from './contact-list';
import { SitesTable } from './sites-table';

function CompanySites({ companyId }: { companyId: string }) {
  const [page, setPage] = useState(1);
  const query = useApiQuery<Paginated<AdminSiteDto>>(ADMIN_API.sites({ companyId, page }));

  return (
    <section aria-labelledby="company-sites-title">
      <h2 id="company-sites-title" className="section-title">
        Sites
      </h2>
      <QueryResult query={query}>
        {(result) => (
          <SitesTable
            result={result}
            loading={query.loading}
            onPageChange={setPage}
            showCompany={false}
          />
        )}
      </QueryResult>
    </section>
  );
}

function CompanyDetail({ company }: { company: AdminCompanyDetailDto }) {
  return (
    <PageContainer title={company.name} description="Company profile, owners, users and sites.">
      <div className="stack">
        <div className="detail-grid">
          <section className="card" aria-labelledby="company-profile-title">
            <h2 id="company-profile-title" className="card__title">
              Profile
            </h2>
            <DescriptionList
              items={[
                { label: 'Status', value: <StatusBadge status={company.status} /> },
                { label: 'Email', value: company.email },
                { label: 'Phone', value: company.phone },
                { label: 'Address', value: formatAddress(company.address) },
                { label: 'Users', value: company.userCount },
                { label: 'Sites', value: company.siteCount },
                { label: 'Joined', value: formatDate(company.createdAt) },
              ]}
            />
          </section>
          <section className="card" aria-labelledby="company-owners-title">
            <h2 id="company-owners-title" className="card__title">
              Owners
            </h2>
            <ContactList users={company.owners} emptyMessage="This company has no owner." />
          </section>
        </div>

        <section aria-labelledby="company-users-title">
          <h2 id="company-users-title" className="section-title">
            Users
          </h2>
          <div className="card table-card">
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {company.users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone ?? '—'}</td>
                      <td>{humanizeEnum(user.role)}</td>
                      <td>
                        <StatusBadge status={user.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <CompanySites companyId={company.id} />
      </div>
    </PageContainer>
  );
}

export function CompanyDetailPage() {
  const { companyId = '' } = useParams();
  const query = useApiQuery<AdminCompanyDetailDto>(ADMIN_API.company(companyId));

  return (
    <QueryResult query={query}>{(company) => <CompanyDetail company={company} />}</QueryResult>
  );
}
