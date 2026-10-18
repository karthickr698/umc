import { useEffect, useState } from 'react';
import { CircleCheck, CircleX, X } from 'lucide-react';
import type { ToastInput } from './toast-context';

export interface ToastItem extends ToastInput {
  id: number;
}

export interface ToastProps {
  toast: ToastItem;
  /** Closes the toast automatically after this long; hovering pauses the countdown. */
  duration: number;
  onDismiss: (id: number) => void;
}

const ICONS = { success: CircleCheck, error: CircleX } as const;

export function Toast({ toast, duration, onDismiss }: ToastProps) {
  const { id, tone = 'success', title, message } = toast;
  const [paused, setPaused] = useState(false);
  const Icon = ICONS[tone];

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => onDismiss(id), duration);
    return () => window.clearTimeout(timer);
  }, [id, duration, paused, onDismiss]);

  return (
    <div
      className={`toast toast--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Icon className="toast__icon" size={20} aria-hidden />
      <div className="toast__body">
        <p className="toast__title">{title}</p>
        {message && <p className="toast__message">{message}</p>}
      </div>
      <button
        type="button"
        className="icon-button toast__dismiss"
        aria-label="Dismiss"
        onClick={() => onDismiss(id)}
      >
        <X size={16} aria-hidden />
      </button>
      <span
        className="toast__progress"
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
        aria-hidden
      />
    </div>
  );
}
