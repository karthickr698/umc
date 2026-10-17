import type { SiteFinancialReportDto, SiteFinancialTotals } from '@umc/shared';
import { ReportAmount } from './report-amount';

export interface SiteReportTableProps {
  result: SiteFinancialReportDto;
  loading: boolean;
  filtered: boolean;
}

const AMOUNT_COLUMNS: readonly { key: keyof SiteFinancialTotals; label: string }[] = [
  { key: 'clientReceipts', label: 'Client receipts' },
  { key: 'employeePayments', label: 'Employee payments' },
  { key: 'contractorPayments', label: 'Contractor payments' },
  { key: 'materialExpenses', label: 'Material expenses' },
  { key: 'otherExpenses', label: 'Other expenses' },
  { key: 'totalExpenses', label: 'Total expenses' },
  { key: 'balance', label: 'Balance' },
];

function AmountCells({ totals }: { totals: SiteFinancialTotals }) {
  return AMOUNT_COLUMNS.map(({ key }) => (
    <td key={key} className="table__numeric">
      <ReportAmount value={totals[key]} />
    </td>
  ));
}

export function SiteReportTable({ result, loading, filtered }: SiteReportTableProps) {
  const { sites, totals } = result;

  return (
    <div className="card table-card" aria-busy={loading}>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Site</th>
              {AMOUNT_COLUMNS.map(({ key, label }) => (
                <th key={key} scope="col" className="table__numeric">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sites.map((row) => (
              <tr key={row.siteId ?? 'none'}>
                <td>
                  {row.siteId ? (row.siteName ?? 'Unknown site') : 'Not tied to a site'}
                  {row.siteCode && <span className="table__secondary">{row.siteCode}</span>}
                </td>
                <AmountCells totals={row} />
              </tr>
            ))}
          </tbody>
          {sites.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row">Total ({totals.siteCount} sites)</th>
                <AmountCells totals={totals} />
              </tr>
            </tfoot>
          )}
        </table>
        {sites.length === 0 && (
          <p className="table-message">
            {filtered
              ? 'No receipts, payments or expenses match these filters.'
              : 'No receipts, payments or expenses recorded yet.'}
          </p>
        )}
      </div>
    </div>
  );
}
