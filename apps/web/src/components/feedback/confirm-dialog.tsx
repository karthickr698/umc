import { type ReactNode, useId, useRef } from 'react';
import { Trash2, TriangleAlert } from 'lucide-react';
import { useModalDialog } from '@/hooks/use-modal-dialog';
import { InlineAlert } from './inline-alert';
import { Spinner } from './spinner';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Explains what will happen, e.g. which record is deleted. */
  children: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  pendingLabel?: string;
  /** Shown inside the dialog when the action failed, so the user can retry or cancel. */
  error?: { title: string; message: string };
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal asking the user to confirm a destructive action. Focus starts on "Cancel". */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pending = false,
  pendingLabel = 'Working',
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();
  useModalDialog(open, onCancel, cancelRef);

  if (!open) return null;

  return (
    <div
      className="dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
    >
      <div className="dialog__backdrop" onClick={onCancel} aria-hidden />
      <div className="dialog__panel">
        <div className="dialog__header">
          <span className="dialog__icon">
            <TriangleAlert size={22} aria-hidden />
          </span>
          <div className="dialog__heading">
            <h2 id={titleId} className="dialog__title">
              {title}
            </h2>
            <div id={messageId} className="dialog__message">
              {children}
            </div>
          </div>
        </div>
        {error && (
          <InlineAlert tone="error" title={error.title}>
            {error.message}
          </InlineAlert>
        )}
        <div className="dialog__actions">
          <button
            ref={cancelRef}
            type="button"
            className="button"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button--danger"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <Spinner size={16} label={pendingLabel} />
            ) : (
              <Trash2 size={16} aria-hidden />
            )}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
