import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { Toast, type ToastItem } from './toast';
import { ToastContext, type ToastApi } from './toast-context';

const AUTO_CLOSE_MS = 4000;
const MAX_VISIBLE = 4;

/** Renders toasts raised with `useToast()` in a stack at the top right of the screen. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      showToast: (toast) => {
        nextId.current += 1;
        const id = nextId.current;
        setToasts((current) => [...current, { ...toast, id }].slice(-MAX_VISIBLE));
      },
    }),
    [],
  );

  return (
    <ToastContext value={api}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} duration={AUTO_CLOSE_MS} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}
