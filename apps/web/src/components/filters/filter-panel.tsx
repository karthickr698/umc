import { type ReactNode, useId } from 'react';
import { X } from 'lucide-react';
import { DESKTOP_MEDIA_QUERY } from '@/config/layout';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { FilterChip } from './filter-chips';
import { MobileFilterBar } from './mobile-filter-bar';

export interface FilterPanelProps<F extends Record<string, string>> {
  filters: F;
  activeCount: number;
  /** The applied filters, listed as removable chips on small screens. */
  chips: readonly FilterChip<keyof F & string>[];
  onChange: (changes: Partial<F>) => void;
  onReset: () => void;
  /**
   * Keeps a draft consistent while it is edited, e.g. clears a site when the client changes;
   * pass the same rule the page's own `onChange` applies.
   */
  normalize?: (changes: Partial<F>) => Partial<F>;
  /**
   * The filter fields for `values`; each field becomes one cell of the panel grid. Given the
   * applied filters on desktop and an unapplied draft in the small-screen sheet, so render a
   * component that loads its own options from `values`.
   */
  renderFields: (values: F, onChange: (changes: Partial<F>) => void) => ReactNode;
}

/** Always expanded on desktop and applied as you pick; a button and bottom sheet elsewhere. */
export function FilterPanel<F extends Record<string, string>>({
  activeCount,
  ...props
}: FilterPanelProps<F>) {
  const { filters, onChange, onReset, renderFields } = props;
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const titleId = useId();

  if (!isDesktop) return <MobileFilterBar {...props} />;

  return (
    <section className="card filter-panel" aria-labelledby={titleId}>
      <div className="filter-panel__bar">
        <h2 id={titleId} className="filter-panel__title">
          Filters
        </h2>
        {activeCount > 0 && (
          <button type="button" className="button button--ghost" onClick={onReset}>
            <X size={16} aria-hidden />
            Clear all
          </button>
        )}
      </div>
      <div className="filter-panel__fields">{renderFields(filters, onChange)}</div>
    </section>
  );
}
