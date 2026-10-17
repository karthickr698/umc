import type { ReactNode } from 'react';
import { CircleCheck, CircleX, TriangleAlert, X } from 'lucide-react';

export type InlineAlertTone = 'success' | 'warn' | 'error';

export interface InlineAlertProps {
  tone: InlineAlertTone;
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
}

const ICONS = { success: CircleCheck, warn: TriangleAlert, error: CircleX } as const;

/** A dismissible outcome message, e.g. the result of a form submission. */
export function InlineAlert({ tone, title, children, onDismiss }: InlineAlertProps) {
  const Icon = ICONS[tone];

  return (
    <div
      className={`inline-alert inline-alert--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="inline-alert__icon" size={18} aria-hidden />
      <div className="inline-alert__body">
        <p className="inline-alert__title">{title}</p>
        {children && <div className="inline-alert__content">{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="icon-button inline-alert__dismiss"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
