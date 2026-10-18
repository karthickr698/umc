import { useMemo, useState } from 'react';
import { INVOICE_STATUSES, type Paginated, type PaymentHistoryItemDto } from '@umc/shared';
import { DataTable, type DataTableColumn } from '@/components/data/data-table';
import { StackedCell } from '@/components/data/stacked-cell';
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

function paymentColumns(
  onShareResult: (result: FileActionResult | null) => void,
): DataTableColumn<PaymentHistoryItemDto>[] {
  return [
    {
      id: 'date',
      header: 'Date',
      render: (payment) => formatCalendarDate(payment.paymentDate),
    },
    {
      id: 'site',
      header: 'Site',
      render: (payment) => (
        <StackedCell
          primary={payment.siteId ? (payment.siteName ?? 'Unknown site') : MISSING}
          secondary={payment.siteCode}
        />
      ),
    },
    {
      id: 'worker',
      header: 'Worker',
      mobile: 'title',
      render: (payment) => (
        <StackedCell
          primary={payment.workerName ?? 'Unknown worker'}
          secondary={payment.workerCode}
        />
      ),
    },
    {
      id: 'contractor',
      header: 'Contractor',
      render: (payment) =>
        payment.contractorId ? (payment.contractorName ?? 'Unknown contractor') : MISSING,
    },
    {
      id: 'amount',
      header: 'Amount',
      numeric: true,
      mobile: 'aside',
      render: (payment) => <strong>{formatAmount(payment.amount)}</strong>,
    },
    {
      id: 'type',
      header: 'Payment type',
      render: (payment) => PAYMENT_TYPE_LABELS[payment.paymentType],
    },
    {
      id: 'mode',
      header: 'Payment mode',
      render: (payment) => (
        <StackedCell
          primary={PAYMENT_MODE_LABELS[payment.paymentMode]}
          secondary={payment.referenceNumber}
        />
      ),
    },
    {
      id: 'invoice',
      header: 'Invoice',
      render: ({ invoice }) => (
        <StackedCell
          primary={<InvoiceStatusBadge status={invoice?.status} />}
          secondary={invoice?.invoiceNumber}
        />
      ),
    },
    {
      id: 'share',
      header: 'Share',
      mobile: 'actions',
      render: ({ invoice }) =>
        invoice?.status === INVOICE_STATUSES.GENERATED ? (
          <InvoiceShareButton invoice={invoice} onResult={onShareResult} />
        ) : (
          MISSING
        ),
    },
  ];
}

export function PaymentHistoryTable({
  result,
  loading,
  filtered,
  onPageChange,
}: PaymentHistoryTableProps) {
  const [shareResult, setShareResult] = useState<FileActionResult | null>(null);
  const columns = useMemo(() => paymentColumns(setShareResult), []);

  return (
    <>
      {shareResult && (
        <FileActionAlert result={shareResult} onDismiss={() => setShareResult(null)} />
      )}
      <DataTable
        result={result}
        columns={columns}
        loading={loading}
        emptyMessage={filtered ? 'No payments match these filters.' : 'No payments recorded yet.'}
        onPageChange={onPageChange}
      />
    </>
  );
}
