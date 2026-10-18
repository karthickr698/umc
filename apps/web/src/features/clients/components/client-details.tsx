import { CalendarPlus, Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { ClientDto } from '@umc/shared';
import { AddressValue } from '@/components/data/address-value';
import { DetailRow, DetailSection } from '@/components/data/detail-section';
import { DetailsProfile } from '@/components/data/details-profile';
import { StatusBadge } from '@/components/data/status-badge';
import type { ResourceDetailsProps } from '@/components/pages/resource-list-view';
import { addressLines, formatDate } from '@/utils/format';

export function ClientDetails({ item: client, onEdit }: ResourceDetailsProps<ClientDto>) {
  const address = addressLines(client.address);

  return (
    <div className="details">
      <DetailsProfile
        name={client.name}
        onEdit={onEdit}
        meta={
          <>
            <StatusBadge status={client.status} />
            <span>Client since {formatDate(client.createdAt)}</span>
          </>
        }
      />

      <DetailSection title="Contact">
        <DetailRow
          icon={Phone}
          label="Phone"
          value={
            client.phone && (
              <a className="text-link" href={`tel:${client.phone}`}>
                {client.phone}
              </a>
            )
          }
        />
        <DetailRow
          icon={Mail}
          label="Email"
          value={
            client.email && (
              <a className="text-link" href={`mailto:${client.email}`}>
                {client.email}
              </a>
            )
          }
        />
      </DetailSection>

      <DetailSection title="Address">
        <DetailRow
          icon={MapPin}
          label="Postal address"
          value={address.length > 0 && <AddressValue lines={address} />}
        />
      </DetailSection>

      <DetailSection title="Record">
        <DetailRow icon={CalendarPlus} label="Added on" value={formatDate(client.createdAt)} />
        <DetailRow icon={Clock} label="Last updated" value={formatDate(client.updatedAt)} />
      </DetailSection>
    </div>
  );
}
