import { CalendarPlus, Clock, Mail, MapPin, Phone, Users, Wrench } from 'lucide-react';
import type { ContractorDto, ContractorEmployeeDto, Paginated } from '@umc/shared';
import { AddressValue } from '@/components/data/address-value';
import { DetailRow, DetailSection } from '@/components/data/detail-section';
import { DetailsProfile } from '@/components/data/details-profile';
import { StatCard } from '@/components/data/stat-card';
import { StatusBadge } from '@/components/data/status-badge';
import type { ResourceDetailsProps } from '@/components/pages/resource-list-view';
import { useApiQuery } from '@/hooks/use-api-query';
import { RESOURCE_API } from '@/lib/resource-api';
import { addressLines, formatDate, humanizeEnum } from '@/utils/format';
import { useOpenContractorWorkers } from '../lib/contractor-workers-context';

function WorkerCountCard({ contractorId }: { contractorId: string }) {
  const query = useApiQuery<Paginated<ContractorEmployeeDto>>(
    RESOURCE_API.contractorEmployees.list({ contractorId, pageSize: 1 }),
  );
  return (
    <StatCard
      icon={Users}
      tone="positive"
      label="Workers"
      value={query.data?.meta.total ?? '—'}
      loading={query.data === undefined && query.loading}
      hint="Supplied to your sites"
    />
  );
}

export function ContractorDetails({
  item: contractor,
  onEdit,
  onClose,
}: ResourceDetailsProps<ContractorDto>) {
  const openWorkers = useOpenContractorWorkers();
  const address = addressLines(contractor.address);
  const trade = humanizeEnum(contractor.category);

  return (
    <div className="details">
      <DetailsProfile
        name={contractor.name}
        onEdit={onEdit}
        meta={
          <>
            <StatusBadge status={contractor.status} />
            <span className="details__meta-item">
              <Wrench size={14} aria-hidden />
              {trade}
            </span>
          </>
        }
      />

      <div className="details__stats">
        <StatCard icon={Wrench} tone="info" label="Trade" value={trade} hint="Type of work" />
        {openWorkers ? (
          <WorkerCountCard contractorId={contractor.id} />
        ) : (
          <StatCard
            icon={CalendarPlus}
            label="Contractor since"
            value={formatDate(contractor.createdAt)}
          />
        )}
      </div>

      {openWorkers && (
        <section className="detail-section details__callout">
          <div>
            <h3 className="details__callout-title">Workers</h3>
            <p className="details__callout-text">
              See, add and update the workers {contractor.name} sends to your sites.
            </p>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => {
              onClose();
              openWorkers(contractor);
            }}
          >
            <Users size={16} aria-hidden />
            View workers
          </button>
        </section>
      )}

      <DetailSection title="Contact">
        <DetailRow
          icon={Phone}
          label="Phone"
          value={
            contractor.phone && (
              <a className="text-link" href={`tel:${contractor.phone}`}>
                {contractor.phone}
              </a>
            )
          }
        />
        <DetailRow
          icon={Mail}
          label="Email"
          value={
            contractor.email && (
              <a className="text-link" href={`mailto:${contractor.email}`}>
                {contractor.email}
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

      {contractor.notes && (
        <section className="detail-section">
          <h3 className="detail-section__title">Notes</h3>
          <p className="details__notes">{contractor.notes}</p>
        </section>
      )}

      <DetailSection title="Record">
        <DetailRow icon={CalendarPlus} label="Added on" value={formatDate(contractor.createdAt)} />
        <DetailRow icon={Clock} label="Last updated" value={formatDate(contractor.updatedAt)} />
      </DetailSection>
    </div>
  );
}
