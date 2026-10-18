import { CalendarDays, CalendarPlus, Clock, Construction, Handshake, MapPin } from 'lucide-react';
import type { SiteDto } from '@umc/shared';
import { AddressValue } from '@/components/data/address-value';
import { DetailRow, DetailSection } from '@/components/data/detail-section';
import { DetailsProfile } from '@/components/data/details-profile';
import { StatCard } from '@/components/data/stat-card';
import { StatusBadge } from '@/components/data/status-badge';
import type { ResourceDetailsProps } from '@/components/pages/resource-list-view';
import { useClientOptions, useOptionLabels } from '@/hooks/use-record-options';
import { siteStartDay } from '@/lib/sites';
import { addressLines, addressLocality, formatCalendarDate, formatDate } from '@/utils/format';

export function SiteDetails({ item: site, onEdit }: ResourceDetailsProps<SiteDto>) {
  const clients = useClientOptions();
  const clientName = useOptionLabels(clients).get(site.clientId);
  const startDay = siteStartDay(site);
  const address = addressLines(site.address);
  const locality = addressLocality(site.address);

  return (
    <div className="details">
      <DetailsProfile
        name={site.name}
        avatar={<Construction size={26} />}
        onEdit={onEdit}
        meta={
          <>
            <StatusBadge status={site.status} />
            <span className="details__code">{site.code}</span>
            {locality && (
              <span className="details__meta-item">
                <MapPin size={14} aria-hidden />
                {locality}
              </span>
            )}
          </>
        }
      />

      <div className="details__stats">
        <StatCard
          icon={Handshake}
          tone="info"
          label="Client"
          value={clientName ?? '—'}
          loading={clients.loading}
          hint="Site owner"
        />
        <StatCard
          icon={CalendarDays}
          tone="positive"
          label="Start date"
          value={startDay ? formatCalendarDate(startDay) : 'Not set'}
          hint="Project kickoff"
        />
      </div>

      <DetailSection title="Location">
        <DetailRow
          icon={MapPin}
          label="Site address"
          value={address.length > 0 && <AddressValue lines={address} />}
        />
      </DetailSection>

      <DetailSection title="Record">
        <DetailRow icon={CalendarPlus} label="Added on" value={formatDate(site.createdAt)} />
        <DetailRow icon={Clock} label="Last updated" value={formatDate(site.updatedAt)} />
      </DetailSection>
    </div>
  );
}
