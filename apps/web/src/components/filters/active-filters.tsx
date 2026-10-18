import { X } from 'lucide-react';
import type { FilterChip } from './filter-chips';

export interface ActiveFiltersProps<K extends string> {
  chips: readonly FilterChip<K>[];
  onRemove: (chip: FilterChip<K>) => void;
  onClearAll: () => void;
}

/** The applied filters as chips; each can be removed on its own. */
export function ActiveFilters<K extends string>({
  chips,
  onRemove,
  onClearAll,
}: ActiveFiltersProps<K>) {
  return (
    <ul className="active-filters" aria-label="Applied filters">
      {chips.map((chip) => (
        <li key={chip.id}>
          <button
            type="button"
            className="filter-chip"
            onClick={() => onRemove(chip)}
            aria-label={`Remove filter ${chip.label}: ${chip.value}`}
          >
            <span className="filter-chip__label">{chip.label}</span>
            <span className="filter-chip__value">{chip.value}</span>
            <X className="filter-chip__remove" size={14} aria-hidden />
          </button>
        </li>
      ))}
      {chips.length > 1 && (
        <li>
          <button type="button" className="filter-chip filter-chip--clear" onClick={onClearAll}>
            Clear all
          </button>
        </li>
      )}
    </ul>
  );
}
