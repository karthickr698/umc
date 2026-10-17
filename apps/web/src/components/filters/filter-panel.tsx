import { useId, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal, X } from 'lucide-react';

export interface FilterPanelProps {
  activeCount: number;
  onReset: () => void;
  /** The filter fields; each becomes one cell of the panel grid. */
  children: ReactNode;
}

/** Always expanded on desktop; collapsed behind a "Filters" toggle on small screens. */
export function FilterPanel({ activeCount, onReset, children }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const fieldsId = useId();
  const titleId = useId();

  return (
    <section
      className={`card filter-panel${open ? ' filter-panel--open' : ''}`}
      aria-labelledby={titleId}
    >
      <div className="filter-panel__bar">
        <h2 id={titleId} className="filter-panel__title">
          Filters
        </h2>
        <button
          type="button"
          className="button filter-panel__toggle"
          aria-expanded={open}
          aria-controls={fieldsId}
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal size={16} aria-hidden />
          Filters
          {activeCount > 0 && (
            <span className="count-badge" aria-label={`${activeCount} active`}>
              {activeCount}
            </span>
          )}
          <ChevronDown className="filter-panel__chevron" size={16} aria-hidden />
        </button>
        {activeCount > 0 && (
          <button type="button" className="button button--ghost" onClick={onReset}>
            <X size={16} aria-hidden />
            Clear all
          </button>
        )}
      </div>

      <div id={fieldsId} className="filter-panel__fields">
        {children}
      </div>
    </section>
  );
}
