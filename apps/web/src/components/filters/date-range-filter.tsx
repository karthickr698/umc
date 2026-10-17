import { DateField } from '@/components/forms/date-field';
import { SelectField } from '@/components/forms/select-field';
import {
  CUSTOM_RANGE_ID,
  DATE_RANGE_PRESETS,
  type DateRange,
  matchPreset,
} from '@/lib/date-presets';

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESET_OPTIONS = DATE_RANGE_PRESETS.map(({ id, label }) => ({ value: id, label }));
const CUSTOM_OPTION = { value: CUSTOM_RANGE_ID, label: 'Custom range' };

/** A preset picker plus from/to day inputs; editing a day switches the picker to "Custom". */
export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const presetId = matchPreset(value);
  const presetOptions =
    presetId === CUSTOM_RANGE_ID ? [...PRESET_OPTIONS, CUSTOM_OPTION] : PRESET_OPTIONS;

  const handlePresetChange = (id: string) => {
    const preset = DATE_RANGE_PRESETS.find((candidate) => candidate.id === id);
    if (preset) onChange(preset.range());
  };

  return (
    <div className="date-range-filter" role="group" aria-label="Date range">
      <SelectField
        label="Period"
        value={presetId}
        options={presetOptions}
        required
        onChange={handlePresetChange}
      />
      <DateField
        label="From"
        placeholder="Any day"
        value={value.from}
        max={value.to || undefined}
        onChange={(from) => onChange({ ...value, from })}
      />
      <DateField
        label="To"
        placeholder="Any day"
        value={value.to}
        min={value.from || undefined}
        onChange={(to) => onChange({ ...value, to })}
      />
    </div>
  );
}
