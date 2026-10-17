import { useMemo } from 'react';
import { HandCoins } from 'lucide-react';
import type { ClientPaymentDto, Paginated } from '@umc/shared';
import type { DataTableColumn } from '@/components/data/data-table';
import { StackedCell } from '@/components/data/stacked-cell';
import { ResourceListView } from '@/components/pages/resource-list-view';
import { PAYMENT_MODE_LABELS } from '@/config/labels';
import { useApiQuery } from '@/hooks/use-api-query';
import { useCan } from '@/hooks/use-can';
import { useClientOptions, useOptionLabels, useSiteOptions } from '@/hooks/use-record-options';
import { RESOURCE_API } from '@/lib/resource-api';
import { formatAmount, formatCalendarDate } from '@/utils/format';
import { ClientPaymentFilters } from './components/client-payment-filters';
import { ClientPaymentForm } from './components/client-payment-form';
import { ReceivedTotals } from './components/received-totals';
import { useClientPaymentFilters } from './hooks/use-client-payment-filters';

type Names = ReadonlyMap<string, string>;

function paymentColumns(clientNames: Names, siteNames: Names): DataTableColumn<ClientPaymentDto>[] {
  return [
    {
      id: 'date',
      header: 'Date',
      render: (payment) => formatCalendarDate(payment.receivedDate),
    },
    {
      id: 'client',
      header: 'From',
      render: (payment) => (
        <StackedCell
          primary={clientNames.get(payment.clientId) ?? '—'}
          secondary={payment.siteId ? siteNames.get(payment.siteId) : 'Not for a specific site'}
        />
      ),
    },
    {
      id: 'mode',
      header: 'Received by',
      render: (payment) => (
        <StackedCell
          primary={PAYMENT_MODE_LABELS[payment.paymentMode]}
          secondary={payment.referenceNumber}
        />
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      numeric: true,
      render: (payment) => <strong>{formatAmount(payment.amount)}</strong>,
    },
  ];
}

export function ClientPaymentsPage() {
  const canManage = useCan('manageClientPayments');
  const { filters, query, page, activeCount, update, reset, setPage } = useClientPaymentFilters();
  const list = useApiQuery<Paginated<ClientPaymentDto>>(
    RESOURCE_API.clientPayments.list({ ...query, page }),
  );
  const clients = useClientOptions();
  const sites = useSiteOptions(filters.clientId || undefined);
  const allSites = useSiteOptions();
  const clientNames = useOptionLabels(clients);
  const siteNames = useOptionLabels(allSites);
  const columns = useMemo(() => paymentColumns(clientNames, siteNames), [clientNames, siteNames]);
  const paymentName = (payment: ClientPaymentDto) =>
    `${formatAmount(payment.amount)} from ${clientNames.get(payment.clientId) ?? 'client'}`;

  return (
    <ResourceListView<ClientPaymentDto>
      title="Money received"
      description="Payments your clients have given you, in cash, bank transfer, UPI or cheque."
      noun="payment"
      addLabel="Add money received"
      api={RESOURCE_API.clientPayments}
      list={list}
      filtered={activeCount > 0}
      filters={
        <>
          <ClientPaymentFilters
            filters={filters}
            activeCount={activeCount}
            clients={clients}
            sites={sites}
            onChange={update}
            onReset={reset}
          />
          <ReceivedTotals filters={query} />
        </>
      }
      intro={{
        icon: HandCoins,
        title: 'Record money from your clients',
        message:
          'Whenever a client pays you, add it here. You will always know how much each client and site has paid.',
      }}
      onPageChange={setPage}
      columns={columns}
      canManage={canManage}
      itemName={paymentName}
      Form={ClientPaymentForm}
    />
  );
}
