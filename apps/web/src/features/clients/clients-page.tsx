import { Handshake } from 'lucide-react';
import { CLIENT_STATUSES, type ClientDto } from '@umc/shared';
import { ContactCell } from '@/components/data/contact-cell';
import type { DataTableColumn } from '@/components/data/data-table';
import { StatusBadge } from '@/components/data/status-badge';
import { ResourceListPage } from '@/components/pages/resource-list-page';
import { useCan } from '@/hooks/use-can';
import { RESOURCE_API } from '@/lib/resource-api';
import { formatAddress } from '@/utils/format';
import { ClientForm } from './components/client-form';

const STATUSES = Object.values(CLIENT_STATUSES);

const COLUMNS: readonly DataTableColumn<ClientDto>[] = [
  { id: 'name', header: 'Client', render: (client) => client.name },
  { id: 'contact', header: 'Contact', render: (client) => <ContactCell {...client} /> },
  { id: 'address', header: 'Address', render: (client) => formatAddress(client.address) || '—' },
  { id: 'status', header: 'Status', render: (client) => <StatusBadge status={client.status} /> },
];

export function ClientsPage() {
  const canManage = useCan('manageClients');

  return (
    <ResourceListPage<ClientDto>
      title="Clients"
      description="Customers you build for and their contact details."
      noun="client"
      api={RESOURCE_API.clients}
      statuses={STATUSES}
      searchLabel="Name, email or phone"
      columns={COLUMNS}
      canManage={canManage}
      itemName={(client) => client.name}
      intro={{
        icon: Handshake,
        title: 'Add your first client',
        message:
          'A client is the person or company you build for. Every site belongs to a client, so start here.',
      }}
      Form={ClientForm}
    />
  );
}
