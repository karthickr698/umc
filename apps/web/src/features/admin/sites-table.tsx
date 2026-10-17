import { Link } from 'react-router';
import type { AdminSiteDto, Paginated } from '@umc/shared';
import { Pagination } from '@/components/data/pagination';
import { StatusBadge } from '@/components/data/status-badge';
import { adminCompanyPath, adminSitePath } from '@/config/routes';
import { formatDate } from '@/utils/format';

export interface SitesTableProps {
  result: Paginated<AdminSiteDto>;
  loading: boolean;
  onPageChange: (page: number) => void;
  /** Hide the company column when the table is already scoped to one company. */
  showCompany?: boolean;
}

export function SitesTable({ result, loading, onPageChange, showCompany = true }: SitesTableProps) {
  return (
    <div className="card table-card" aria-busy={loading}>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Site</th>
              {showCompany && <th scope="col">Company</th>}
              <th scope="col">Client</th>
              <th scope="col">Status</th>
              <th scope="col">Start date</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((site) => (
              <tr key={site.id}>
                <td>
                  <Link className="text-link" to={adminSitePath(site.id)}>
                    {site.name}
                  </Link>
                  <span className="table__secondary">{site.code}</span>
                </td>
                {showCompany && (
                  <td>
                    <Link className="text-link" to={adminCompanyPath(site.companyId)}>
                      {site.companyName}
                    </Link>
                  </td>
                )}
                <td>{site.clientName}</td>
                <td>
                  <StatusBadge status={site.status} />
                </td>
                <td>{site.startDate ? formatDate(site.startDate) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {result.items.length === 0 && <p className="table-message">No sites found.</p>}
      </div>
      <Pagination meta={result.meta} onPageChange={onPageChange} disabled={loading} />
    </div>
  );
}
