import type { SelectOptionsSource } from '@/hooks/use-select-options';
import {
  CUSTOM_RANGE_ID,
  DATE_RANGE_PRESETS,
  type DateRange,
  matchPreset,
} from '@/lib/date-presets';
import { formatCalendarDate } from '@/utils/format';

/** One applied filter, shown as a removable chip. */
export interface FilterChip<K extends string = string> {
  id: string;
  /** What is filtered, e.g. "Site". */
  label: string;
  /** The applied choice, e.g. "Tower A". */
  value: string;
  /** Filters cleared when the chip is removed. */
  keys: readonly K[];
}

function describeRange({ from, to }: DateRange): string {
  const presetId = matchPreset({ from, to });
  const preset = DATE_RANGE_PRESETS.find((candidate) => candidate.id === presetId);
  if (preset && presetId !== CUSTOM_RANGE_ID) return preset.label;
  if (from && to) return `${formatCalendarDate(from)} – ${formatCalendarDate(to)}`;
  return from ? `From ${formatCalendarDate(from)}` : `Until ${formatCalendarDate(to)}`;
}

/** Chip for a from/to range, named after its preset when it matches one. */
export function dateRangeChip(range: DateRange): FilterChip<'from' | 'to'> | null {
  if (!range.from && !range.to) return null;
  return { id: 'period', label: 'Period', value: describeRange(range), keys: ['from', 'to'] };
}

/** Chip for a select filter, showing the chosen option's label. */
export function selectChip<K extends string>(
  key: K,
  label: string,
  value: string,
  { options, loading }: SelectOptionsSource,
): FilterChip<K> | null {
  if (!value) return null;
  const option = options.find((candidate) => candidate.value === value);
  return {
    id: key,
    label,
    value: option?.label ?? (loading ? 'Loading…' : 'Selected'),
    keys: [key],
  };
}

/** The chips of the filters that are set, in the given order. */
export function presentChips<K extends string>(
  ...chips: readonly (FilterChip<K> | null)[]
): FilterChip<K>[] {
  return chips.filter((chip): chip is FilterChip<K> => chip !== null);
}
