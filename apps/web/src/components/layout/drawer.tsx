import { type ReactNode, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useModalDialog } from '@/hooks/use-modal-dialog';

export interface DrawerProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  onClose: () => void;
  /** Controls shown left of the close button, e.g. a "Back" button. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Modal side panel sliding in from the right. Keep one instance mounted and swap its content,
 * so focus returns to the element that opened it rather than to a panel that no longer exists.
 */
export function Drawer({ open, title, description, onClose, actions, children }: DrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useModalDialog(open, onClose, closeButtonRef);

  if (!open) return null;

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="drawer__backdrop" onClick={onClose} aria-hidden />
      <div className="drawer__panel">
        <header className="drawer__header">
          <div className="drawer__heading">
            <h2 id={titleId} className="drawer__title">
              {title}
            </h2>
            {description && <div className="drawer__description">{description}</div>}
          </div>
          {actions}
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="drawer__body">{children}</div>
      </div>
    </div>
  );
}
