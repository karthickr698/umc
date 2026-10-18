import { type ReactNode, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionProps {
  title: string;
  /** Short summary next to the title, e.g. what the section holds. */
  hint?: ReactNode;
  defaultOpen?: boolean;
  /** Keeps the section open regardless of the toggle, e.g. while it holds a validation error. */
  forceOpen?: boolean;
  children: ReactNode;
}

/** A section whose content the user can expand and collapse. */
export function Accordion({
  title,
  hint,
  defaultOpen = false,
  forceOpen = false,
  children,
}: AccordionProps) {
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const expanded = open || forceOpen;

  return (
    <section className={`accordion${expanded ? ' accordion--open' : ''}`}>
      <button
        type="button"
        className="accordion__trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setOpen(!expanded)}
      >
        <span className="accordion__heading">
          <span className="accordion__title">{title}</span>
          {hint && <span className="accordion__hint">{hint}</span>}
        </span>
        <ChevronDown className="accordion__chevron" size={18} aria-hidden />
      </button>
      {expanded && (
        <div id={panelId} className="accordion__panel">
          {children}
        </div>
      )}
    </section>
  );
}
