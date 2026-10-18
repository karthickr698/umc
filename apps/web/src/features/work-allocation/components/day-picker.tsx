import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateInput } from '@/components/forms/date-input';
import { FormField } from '@/components/forms/form-field';
import { addDays, parseCalendarDate, toCalendarDate, today } from '@/utils/calendar-date';

export interface DayPickerProps {
  /** `YYYY-MM-DD`. */
  value: string;
  onChange: (day: string) => void;
  label?: string;
}

const shiftDay = (day: string, days: number) =>
  toCalendarDate(addDays(parseCalendarDate(day), days));

/** A date input with previous/next day and "Today" shortcuts. */
export function DayPicker({ value, onChange, label = 'Date' }: DayPickerProps) {
  const todayValue = toCalendarDate(today());

  return (
    <FormField label={label}>
      {(control) => (
        <div className="day-picker">
          <button
            type="button"
            className="button day-picker__step"
            aria-label="Previous day"
            onClick={() => onChange(shiftDay(value, -1))}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <DateInput
            {...control}
            required
            className="day-picker__input"
            value={value}
            onChange={(day) => {
              if (day) onChange(day);
            }}
          />
          <button
            type="button"
            className="button day-picker__step"
            aria-label="Next day"
            onClick={() => onChange(shiftDay(value, 1))}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="button button--ghost"
            disabled={value === todayValue}
            onClick={() => onChange(todayValue)}
          >
            Today
          </button>
        </div>
      )}
    </FormField>
  );
}
