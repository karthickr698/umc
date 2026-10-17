import { type RefObject, useEffect } from 'react';
import { useEscapeKey } from './use-escape-key';

/**
 * Behaviour shared by modal overlays: Escape closes, the page behind stops scrolling, focus
 * moves to `initialFocusRef` on open and returns to the previously focused element on close.
 */
export function useModalDialog(
  open: boolean,
  onClose: () => void,
  initialFocusRef: RefObject<HTMLElement | null>,
): void {
  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    initialFocusRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, initialFocusRef]);
}
