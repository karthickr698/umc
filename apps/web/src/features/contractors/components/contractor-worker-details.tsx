import { CalendarPlus, Clock, HardHat, Phone, Wallet } from 'lucide-react';
import type { ContractorDto, ContractorEmployeeDto } from '@umc/shared';
import { DetailRow, DetailSection } from '@/components/data/detail-section';
import { DetailsProfile } from '@/components/data/details-profile';
import { StatCard } from '@/components/data/stat-card';
import { StatusBadge } from '@/components/data/status-badge';
import { formatAmount, formatDate, humanizeEnum } from '@/utils/format';

export interface ContractorWorkerDetailsProps {
  worker: ContractorEmployeeDto;
  contractor: ContractorDto;
  /** Absent when the user may not edit workers. */
  onEdit?: () => void;
}

export function ContractorWorkerDetails({
  worker,
  contractor,
  onEdit,
}: ContractorWorkerDetailsProps) {
  return (
    <div className="details">
      <DetailsProfile
        name={worker.name}
        onEdit={onEdit}
        meta={
          <>
            <StatusBadge status={worker.status} />
            <span className="details__code">{worker.employeeCode}</span>
          </>
        }
      />

      <div className="details__stats">
        <StatCard
          icon={Wallet}
          tone="positive"
          label="Daily rate"
          value={formatAmount(worker.dailyRate)}
          hint="Per working day"
        />
        <StatCard
          icon={HardHat}
          tone="info"
          label="Contractor"
          value={contractor.name}
          hint={humanizeEnum(contractor.category)}
        />
      </div>

      <DetailSection title="Contact">
        <DetailRow
          icon={Phone}
          label="Phone"
          value={
            worker.phone && (
              <a className="text-link" href={`tel:${worker.phone}`}>
                {worker.phone}
              </a>
            )
          }
        />
      </DetailSection>

      <DetailSection title="Record">
        <DetailRow icon={CalendarPlus} label="Added on" value={formatDate(worker.createdAt)} />
        <DetailRow icon={Clock} label="Last updated" value={formatDate(worker.updatedAt)} />
      </DetailSection>
    </div>
  );
}
