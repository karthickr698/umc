import {
  WORKER_TYPE_LABELS,
  type WorkerFinancialReportDto,
  type WorkerFinancialTotals,
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

/** Work days and money columns, shared by each worker's row and the totals row. */
function TotalCells({ totals }: { totals: WorkerFinancialTotals }) {
  return (
    <>
      <td className="table__numeric" data-label="Work days">
        {totals.assignedDays}
      </td>
      <td className="table__numeric" data-label="Earned">
        <Amount value={totals.earnedAmount} />
      </td>
      <td className="table__numeric" data-label="Paid">
        <Amount value={totals.paidAmount} />
      </td>
      <td className="table__numeric" data-label="Outstanding" data-mobile="aside" data-caption>
        <Amount value={totals.outstandingAmount} />
      </td>
    </>
  );
}

function WorkerReportRow({ item: { worker, totals } }: { item: WorkerSummaryListItem }) {
  return (
    <tr>
      <td data-label="Worker" data-mobile="title">
        {worker.name || 'Unknown worker'}
        {worker.employeeCode && <span className="table__secondary">{worker.employeeCode}</span>}
      </td>
      <td data-label="Type">{WORKER_TYPE_LABELS[worker.workerType]}</td>
      <td data-label="Contractor">
        {worker.contractorId ? (worker.contractorName ?? 'Unknown contractor') : MISSING}
      </td>
      <TotalCells totals={totals} />
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
    <div className="card table-card table-card--stacked" aria-busy={loading}>
      <div className="table-scroll">
        <table className="table table--stacked">
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
                <th scope="row" colSpan={3} data-mobile="title">
                  Total ({totals.workerCount} workers)
                </th>
                <TotalCells totals={totals} />
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
