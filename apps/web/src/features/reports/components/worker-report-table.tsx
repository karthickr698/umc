import {
  WORKER_TYPE_LABELS,
  type WorkerFinancialReportDto,
  type WorkerSummaryListItem,
} from '@umc/shared';
import { Pagination } from '@/components/data/pagination';
import { workerKey } from '@/lib/worker-key';
import { ReportAmount as Amount } from './report-amount';

export interface WorkerReportTableProps {
  result: WorkerFinancialReportDto;
  loading: boolean;
  filtered: boolean;
  onPageChange: (page: number) => void;
}

const MISSING = '—';

function WorkerReportRow({ item: { worker, totals } }: { item: WorkerSummaryListItem }) {
  return (
    <tr>
      <td>
        {worker.name || 'Unknown worker'}
        {worker.employeeCode && <span className="table__secondary">{worker.employeeCode}</span>}
      </td>
      <td>{WORKER_TYPE_LABELS[worker.workerType]}</td>
      <td>{worker.contractorId ? (worker.contractorName ?? 'Unknown contractor') : MISSING}</td>
      <td className="table__numeric">{totals.assignedDays}</td>
      <td className="table__numeric">
        <Amount value={totals.earnedAmount} />
      </td>
      <td className="table__numeric">
        <Amount value={totals.paidAmount} />
      </td>
      <td className="table__numeric">
        <Amount value={totals.outstandingAmount} />
      </td>
    </tr>
  );
}

export function WorkerReportTable({
  result,
  loading,
  filtered,
  onPageChange,
}: WorkerReportTableProps) {
  const { totals } = result;

  return (
    <div className="card table-card" aria-busy={loading}>
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Worker</th>
              <th scope="col">Type</th>
              <th scope="col">Contractor</th>
              <th scope="col" className="table__numeric">
                Work days
              </th>
              <th scope="col" className="table__numeric">
                Earned
              </th>
              <th scope="col" className="table__numeric">
                Paid
              </th>
              <th scope="col" className="table__numeric">
                Outstanding
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <WorkerReportRow
                key={workerKey(item.worker.workerType, item.worker.id)}
                item={item}
              />
            ))}
          </tbody>
          {result.items.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Total ({totals.workerCount} workers)
                </th>
                <td className="table__numeric">{totals.assignedDays}</td>
                <td className="table__numeric">
                  <Amount value={totals.earnedAmount} />
                </td>
                <td className="table__numeric">
                  <Amount value={totals.paidAmount} />
                </td>
                <td className="table__numeric">
                  <Amount value={totals.outstandingAmount} />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
        {result.items.length === 0 && (
          <p className="table-message">
            {filtered
              ? 'No work or payments match these filters.'
              : 'No work or payments recorded yet.'}
          </p>
        )}
      </div>
      <Pagination meta={result.meta} onPageChange={onPageChange} disabled={loading} />
    </div>
  );
}
