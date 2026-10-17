import { SelectField, type SelectOption } from '@/components/forms/select-field';
import type { SelectOptionsSource } from '@/hooks/use-select-options';

export interface FilterSelectProps {
  label: string;
  /** Label of the "no filter" option, e.g. "All sites". */
  allLabel: string;
  value: string;
  source: SelectOptionsSource;
  onChange: (value: string) => void;
}

/** Keeps a selection from the URL visible even when it is not among the loaded options. */
function withSelected(options: SelectOption[], value: string, loading: boolean): SelectOption[] {
  if (!value || options.some((option) => option.value === value)) return options;
  return [...options, { value, label: loading ? 'Loading…' : 'Selected (not listed)' }];
}

export function FilterSelect({ label, allLabel, value, source, onChange }: FilterSelectProps) {
  const { options, loading, failed } = source;

  return (
    <SelectField
      label={label}
      value={value}
      placeholder={allLabel}
      options={withSelected(options, value, loading)}
      onChange={onChange}
      disabled={loading && !value}
      error={failed ? `Couldn't load ${label.toLowerCase()} options` : undefined}
    />
  );
}
