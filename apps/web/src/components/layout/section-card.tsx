import { type ReactNode, useId } from 'react';

export interface SectionCardProps {
  title: string;
  description?: string;
  /** Controls shown on the right of the header, e.g. a "View all" link. */
  actions?: ReactNode;
  /** Marks the content as updating, e.g. while new data loads behind the current one. */
  busy?: boolean;
  className?: string;
  children: ReactNode;
}

/** A titled card section; the heading labels the region for assistive technology. */
export function SectionCard({
  title,
  description,
  actions,
  busy = false,
  className,
  children,
}: SectionCardProps) {
  const titleId = useId();
  const classes = ['card', 'section-card', className].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-labelledby={titleId} aria-busy={busy}>
      <header className="section-card__header">
        <div className="section-card__heading">
          <h2 id={titleId} className="section-card__title">
            {title}
          </h2>
          {description && <p className="section-card__description">{description}</p>}
        </div>
        {actions && <div className="section-card__actions">{actions}</div>}
      </header>
      <div className="section-card__body">{children}</div>
    </section>
  );
}
