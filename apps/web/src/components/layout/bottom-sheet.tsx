import { type ReactNode, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalDialog } from '@/hooks/use-modal-dialog';

export interface BottomSheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Actions pinned below the scrolling content, e.g. "Apply". */
  footer?: ReactNode;
  children: ReactNode;
}

/** Modal panel rising from the bottom of the screen, at most 85% of its height. */
export function BottomSheet({ open, title, onClose, footer, children }: BottomSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useModalDialog(open, onClose, closeButtonRef);

  if (!open) return null;

  // Portalled so a blurred or transformed ancestor can't become the fixed panel's containing block.
  return createPortal(
    <div className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="bottom-sheet__backdrop" onClick={onClose} aria-hidden />
      <div className="bottom-sheet__panel">
        <span className="bottom-sheet__handle" aria-hidden />
        <header className="bottom-sheet__header">
          <h2 id={titleId} className="bottom-sheet__title">
            {title}
          </h2>
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
        <div className="bottom-sheet__body">{children}</div>
        {footer && <footer className="bottom-sheet__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
