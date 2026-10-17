import type { ReactNode } from 'react';
import { RotateCw, TriangleAlert } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  /** Shown so users can quote it to support; matches the server logs. */
  requestId?: string;
  onRetry?: () => void;
  /** Extra actions rendered next to the retry button. */
  actions?: ReactNode;
  compact?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  requestId,
  onRetry,
  actions,
  compact = false,
}: ErrorStateProps) {
  return (
    <div className={`error-state${compact ? ' error-state--compact' : ''}`} role="alert">
      <span className="error-state__icon" aria-hidden>
        <TriangleAlert size={compact ? 20 : 28} />
      </span>
      <div className="error-state__body">
        <h2 className="error-state__title">{title}</h2>
        <p className="error-state__message">{message}</p>
        {requestId && <p className="error-state__meta">Reference: {requestId}</p>}
        {(onRetry || actions) && (
          <div className="error-state__actions">
            {onRetry && (
              <button type="button" className="button button--primary" onClick={onRetry}>
                <RotateCw size={16} aria-hidden />
                Try again
              </button>
            )}
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
