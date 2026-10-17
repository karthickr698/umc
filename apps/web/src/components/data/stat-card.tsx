import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/feedback/skeleton';

export type StatTone = 'neutral' | 'positive' | 'negative' | 'info' | 'warn';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  /** Short supporting line under the value. */
  hint?: ReactNode;
  /** Shows a placeholder instead of the value. */
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  hint,
  loading = false,
}: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`} aria-busy={loading}>
      <div className="stat-card__header">
        <h3 className="stat-card__label">{label}</h3>
        <span className="stat-card__icon" aria-hidden>
          <Icon size={18} />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton width="60%" height="1.75rem" />
          <Skeleton width="40%" height="0.875rem" />
        </>
      ) : (
        <>
          <p className="stat-card__value">{value}</p>
          {hint && <p className="stat-card__hint">{hint}</p>}
        </>
      )}
    </article>
  );
}
