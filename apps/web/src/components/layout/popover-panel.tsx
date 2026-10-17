import type { ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';

export interface PopoverPanelProps {
  className: string;
  /** Called instead of Radix's default focus move, e.g. to focus a search box. */
  onOpenAutoFocus?: (event: Event) => void;
  children: ReactNode;
}

/**
 * Floating panel of a `Popover.Root`, rendered above drawers. Escape closes only the panel: it
 * is stopped here so it doesn't also reach the drawer's document-level Escape handler.
 */
export function PopoverPanel({ className, onOpenAutoFocus, children }: PopoverPanelProps) {
  return (
    <Popover.Portal>
      <Popover.Content
        className={`popover-panel ${className}`}
        align="start"
        sideOffset={6}
        collisionPadding={12}
        onOpenAutoFocus={onOpenAutoFocus}
        onEscapeKeyDown={(event) => event.stopPropagation()}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}
