import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: ReactNode;
  /** A call to action below the message, e.g. "Add your first client". */
  action?: ReactNode;
  /** Smaller padding and icon, for use inside a card section. */
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  const classes = ['empty-state', compact && 'empty-state--compact', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <span className="empty-state__icon" aria-hidden>
        <Icon size={compact ? 22 : 28} />
      </span>
      <h2 className="empty-state__title">{title}</h2>
      {message && <p className="empty-state__message">{message}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
