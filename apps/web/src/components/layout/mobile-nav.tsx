import { useRef } from 'react';
import { X } from 'lucide-react';
import type { NavSection } from '@/config/navigation';
import { useModalDialog } from '@/hooks/use-modal-dialog';
import { Brand } from './brand';
import { SidebarNav } from './sidebar-nav';

interface MobileNavProps {
  sections: readonly NavSection[];
  open: boolean;
  onClose: () => void;
}

/** Slide-in navigation drawer for small screens. */
export function MobileNav({ sections, open, onClose }: MobileNavProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useModalDialog(open, onClose, closeButtonRef);

  if (!open) return null;

  return (
    <div className="mobile-nav" role="dialog" aria-modal="true" aria-label="Navigation">
      <div className="mobile-nav__backdrop" onClick={onClose} aria-hidden />
      <div className="mobile-nav__panel">
        <div className="mobile-nav__header">
          <Brand />
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button icon-button--on-dark"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="mobile-nav__body">
          <SidebarNav sections={sections} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
