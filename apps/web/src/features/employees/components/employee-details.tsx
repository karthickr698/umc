import { Briefcase, CalendarPlus, Clock, Phone, Wallet } from 'lucide-react';
import type { EmployeeDto } from '@umc/shared';
import { DetailRow, DetailSection } from '@/components/data/detail-section';
import { DetailsProfile } from '@/components/data/details-profile';
import { StatCard } from '@/components/data/stat-card';
import { StatusBadge } from '@/components/data/status-badge';
import type { ResourceDetailsProps } from '@/components/pages/resource-list-view';
import { formatAmount, formatDate } from '@/utils/format';

export function EmployeeDetails({ item: employee, onEdit }: ResourceDetailsProps<EmployeeDto>) {
  return (
    <div className="details">
      <DetailsProfile
        name={employee.name}
        onEdit={onEdit}
        meta={
          <>
            <StatusBadge status={employee.status} />
            <span className="details__code">{employee.employeeCode}</span>
          </>
        }
      />

      <div className="details__stats">
        <StatCard
          icon={Wallet}
          tone="positive"
          label="Daily wage"
          value={formatAmount(employee.dailyRate)}
          hint="Per working day"
        />
        <StatCard icon={Briefcase} tone="info" label="Role" value={employee.role} hint="Trade" />
      </div>

      <DetailSection title="Contact">
        <DetailRow
          icon={Phone}
          label="Phone"
          value={
            employee.phone && (
              <a className="text-link" href={`tel:${employee.phone}`}>
                {employee.phone}
              </a>
            )
          }
        />
      </DetailSection>

      {employee.notes && (
        <section className="detail-section">
          <h3 className="detail-section__title">Notes</h3>
          <p className="details__notes">{employee.notes}</p>
        </section>
      )}

      <DetailSection title="Record">
        <DetailRow icon={CalendarPlus} label="Added on" value={formatDate(employee.createdAt)} />
        <DetailRow icon={Clock} label="Last updated" value={formatDate(employee.updatedAt)} />
      </DetailSection>
    </div>
  );
}
