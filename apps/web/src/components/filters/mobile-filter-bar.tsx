import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { BottomSheet } from '@/components/layout/bottom-sheet';
import { ActiveFilters } from './active-filters';
import type { FilterPanelProps } from './filter-panel';

export type MobileFilterBarProps<F extends Record<string, string>> = Omit<
  FilterPanelProps<F>,
  'activeCount'
>;

function cleared<F extends Record<string, string>>(keys: readonly (keyof F)[]): Partial<F> {
  return Object.fromEntries(keys.map((key) => [key, ''])) as Partial<F>;
}

function changedFrom<F extends Record<string, string>>(draft: F, applied: F): Partial<F> {
  return Object.fromEntries(
    Object.entries(draft).filter(([key, value]) => applied[key] !== value),
  ) as Partial<F>;
}

/**
 * Phones: a "Filters" button with the applied filters as chips. The button opens a bottom sheet
 * where filters are picked as a draft and applied together.
 */
export function MobileFilterBar<F extends Record<string, string>>({
  filters,
  chips,
  onChange,
  onReset,
  normalize = (changes) => changes,
  renderFields,
}: MobileFilterBarProps<F>) {
  const [draft, setDraft] = useState<F | null>(null);
  const close = () => setDraft(null);

  const updateDraft = (changes: Partial<F>) =>
    setDraft((current) => current && { ...current, ...normalize(changes) });

  const apply = () => {
    if (!draft) return;
    const changes = changedFrom(draft, filters);
    if (Object.keys(changes).length > 0) onChange(changes);
    close();
  };

  return (
    <section className="filter-bar" aria-label="Filters">
      <button
        type="button"
        className={`filter-bar__button${chips.length > 0 ? ' filter-bar__button--active' : ''}`}
        onClick={() => setDraft(filters)}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal size={16} aria-hidden />
        Filters
        {chips.length > 0 && (
          <span className="count-badge" aria-label={`${chips.length} applied`}>
            {chips.length}
          </span>
        )}
      </button>
      {chips.length > 0 ? (
        <ActiveFilters
          chips={chips}
          onRemove={(chip) => onChange(cleared<F>(chip.keys))}
          onClearAll={onReset}
        />
      ) : (
        <p className="filter-bar__hint">Showing all records</p>
      )}

      <BottomSheet
        open={draft !== null}
        title="Filters"
        onClose={close}
        footer={
          <>
            <button
              type="button"
              className="button button--ghost"
              onClick={() =>
                setDraft(
                  (current) => current && { ...current, ...cleared<F>(Object.keys(current)) },
                )
              }
            >
              Reset
            </button>
            <button type="button" className="button button--primary" onClick={apply}>
              Apply filters
            </button>
          </>
        }
      >
        {draft && <div className="filter-sheet__fields">{renderFields(draft, updateDraft)}</div>}
      </BottomSheet>
    </section>
  );
}
