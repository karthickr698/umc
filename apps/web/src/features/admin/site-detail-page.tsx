import { Link, useParams } from 'react-router';
import type { AdminSiteDetailDto, DashboardTotals } from '@umc/shared';
import { DescriptionList } from '@/components/data/description-list';
import { QueryResult } from '@/components/data/query-result';
import { StatusBadge } from '@/components/data/status-badge';
import { PageContainer } from '@/components/layout/page-container';
import { adminCompanyPath } from '@/config/routes';
import { useApiQuery } from '@/hooks/use-api-query';
import { formatAddress, formatAmount, formatDate } from '@/utils/format';
import { ADMIN_API } from './admin-api';
import { ContactList } from './contact-list';

const TOTAL_LABELS: readonly { key: keyof DashboardTotals; label: string }[] = [
  { key: 'clientPaymentsReceived', label: 'Received from client' },
  { key: 'workerPayments', label: 'Paid to employees' },
  { key: 'contractorPayments', label: 'Paid to contractors' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'balance', label: 'Balance' },
];

function SiteDetail({ detail }: { detail: AdminSiteDetailDto }) {
  const { site, company, owners, client, totals } = detail;

  return (
    <PageContainer title={site.name} description={`${site.code} · ${company.name}`}>
      <div className="stack">
        <section className="card" aria-labelledby="site-totals-title">
          <h2 id="site-totals-title" className="card__title">
            Money to date
          </h2>
          <div className="totals-grid">
            {TOTAL_LABELS.map(({ key, label }) => (
              <div key={key} className="total">
                <span className="total__label">{label}</span>
                <span className={`total__value${totals[key] < 0 ? ' total__value--negative' : ''}`}>
                  {formatAmount(totals[key])}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="detail-grid">
          <section className="card" aria-labelledby="site-info-title">
            <h2 id="site-info-title" className="card__title">
              Site
            </h2>
            <DescriptionList
              items={[
                { label: 'Code', value: site.code },
                { label: 'Status', value: <StatusBadge status={site.status} /> },
                { label: 'Start date', value: site.startDate && formatDate(site.startDate) },
                { label: 'Address', value: formatAddress(site.address) },
                { label: 'Created', value: formatDate(site.createdAt) },
              ]}
            />
          </section>

          <section className="card" aria-labelledby="site-company-title">
            <h2 id="site-company-title" className="card__title">
              Company
            </h2>
            <DescriptionList
              items={[
                {
                  label: 'Name',
                  value: (
                    <Link className="text-link" to={adminCompanyPath(company.id)}>
                      {company.name}
                    </Link>
                  ),
                },
                { label: 'Status', value: <StatusBadge status={company.status} /> },
                { label: 'Email', value: company.email },
                { label: 'Phone', value: company.phone },
              ]}
            />
            <h3 className="section-title">Owners</h3>
            <ContactList users={owners} emptyMessage="This company has no owner." />
          </section>

          <section className="card" aria-labelledby="site-client-title">
            <h2 id="site-client-title" className="card__title">
              Client
            </h2>
            <DescriptionList
              items={[
                { label: 'Name', value: client.name },
                { label: 'Status', value: <StatusBadge status={client.status} /> },
                { label: 'Email', value: client.email },
                { label: 'Phone', value: client.phone },
                { label: 'Address', value: formatAddress(client.address) },
              ]}
            />
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

export function SiteDetailPage() {
  const { siteId = '' } = useParams();
  const query = useApiQuery<AdminSiteDetailDto>(ADMIN_API.site(siteId));

  return <QueryResult query={query}>{(detail) => <SiteDetail detail={detail} />}</QueryResult>;
}
