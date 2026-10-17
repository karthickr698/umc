import { useState } from 'react';
import { INVOICE_STATUSES, type Paginated, type PaymentHistoryItemDto } from '@umc/shared';
import { Pagination } from '@/components/data/pagination';
import { PAYMENT_MODE_LABELS, PAYMENT_TYPE_LABELS } from '@/config/labels';
import { formatAmount, formatCalendarDate } from '@/utils/format';
import type { FileActionResult } from '../hooks/use-invoice-file-actions';
import { FileActionAlert } from './file-action-alert';
import { InvoiceShareButton } from './invoice-share-button';
import { InvoiceStatusBadge } from './invoice-status-badge';

export interface PaymentHistoryTableProps {
  result: Paginated<PaymentHistoryItemDto>;
  loading: boolean;
  filtered: boolean;
  onPageChange: (page: number) => void;
}

const MISSING = '—';

interface PaymentHistoryRowProps {
  payment: PaymentHistoryItemDto;
  onShareResult: (result: FileActionResult | null) => void;
}

function PaymentHistoryRow({ payment, onShareResult }: PaymentHistoryRowProps) {
  const { invoice } = payment;
  return (
    <tr>
      <td>{formatCalendarDate(payment.paymentDate)}</td>
      <td>
        {payment.siteId ? (payment.siteName ?? 'Unknown site') : MISSING}
        {payment.siteCode && <span className="table__secondary">{payment.siteCode}</span>}
      </td>
      <td>
        {payment.workerName ?? 'Unknown worker'}
        {payment.workerCode && <span className="table__secondary">{payment.workerCode}</span>}
      </td>
      <td>{payment.contractorId ? (payment.contractorName ?? 'Unknown contractor') : MISSING}</td>
      <td className="table__numeric">{formatAmount(payment.amount)}</td>
      <td>{PAYMENT_TYPE_LABELS[payment.paymentType]}</td>
      <td>
        {PAYMENT_MODE_LABELS[payment.paymentMode]}
        {payment.referenceNumber && (
          <span className="table__secondary">{payment.referenceNumber}</span>
        )}
      </td>
      <td>
        <InvoiceStatusBadge status={invoice?.status} />
        {invoice && <span className="table__secondary">{invoice.invoiceNumber}</span>}
      </td>
      <td>
        {invoice?.status === INVOICE_STATUSES.GENERATED ? (
          <InvoiceShareButton invoice={invoice} onResult={onShareResult} />
        ) : (
          MISSING
        )}
      </td>
    </tr>
  );
}

export function PaymentHistoryTable({
  result,
  loading,
  filtered,
  onPageChange,
}: PaymentHistoryTableProps) {
  const [shareResult, setShareResult] = useState<FileActionResult | null>(null);

  return (
    <>
      {shareResult && (
        <FileActionAlert result={shareResult} onDismiss={() => setShareResult(null)} />
      )}
      <div className="card table-card" aria-busy={loading}>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Site</th>
                <th scope="col">Worker</th>
                <th scope="col">Contractor</th>
                <th scope="col" className="table__numeric">
                  Amount
                </th>
                <th scope="col">Payment type</th>
                <th scope="col">Payment mode</th>
                <th scope="col">Invoice</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((payment) => (
                <PaymentHistoryRow
                  key={payment.id}
                  payment={payment}
                  onShareResult={setShareResult}
                />
              ))}
            </tbody>
          </table>
          {result.items.length === 0 && (
            <p className="table-message">
              {filtered ? 'No payments match these filters.' : 'No payments recorded yet.'}
            </p>
          )}
        </div>
        <Pagination meta={result.meta} onPageChange={onPageChange} disabled={loading} />
      </div>
    </>
  );
}
