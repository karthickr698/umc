import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DetailRowProps {
  icon: LucideIcon;
  label: string;
  /** Empty strings, `false`, `null` and `undefined` are shown as "Not provided". */
  value: ReactNode;
}

export function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  const empty = value === '' || value === false || value === null || value === undefined;
  return (
    <div className="detail-row">
      <span className="detail-row__icon">
        <Icon size={16} aria-hidden />
      </span>
      <div className="detail-row__body">
        <dt className="detail-row__label">{label}</dt>
        <dd className={`detail-row__value${empty ? ' detail-row__value--empty' : ''}`}>
          {empty ? 'Not provided' : value}
        </dd>
      </div>
    </div>
  );
}

export interface DetailSectionProps {
  title: string;
  /** `DetailRow`s. */
  children: ReactNode;
}

/** A titled card of label/value rows in a details view. */
export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="detail-section">
      <h3 className="detail-section__title">{title}</h3>
      <dl className="detail-section__rows">{children}</dl>
    </section>
  );
}
