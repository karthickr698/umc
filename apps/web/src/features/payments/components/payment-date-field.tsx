import { DateInput } from '@/components/forms/date-input';
import { FormField } from '@/components/forms/form-field';
import { addDays, toCalendarDate, today } from '@/utils/calendar-date';

export interface PaymentDateFieldProps {
  value: string;
  onChange: (day: string) => void;
  error?: string;
}

/** Most payments are made today or yesterday, so both are one tap; any day via the picker. */
export function PaymentDateField({ value, onChange, error }: PaymentDateFieldProps) {
  const shortcuts = [
    { label: 'Today', day: toCalendarDate(today()) },
    { label: 'Yesterday', day: toCalendarDate(addDays(today(), -1)) },
  ];

  return (
    <FormField label="Date" error={error}>
      {(control) => (
        <div className="payment-date">
          <div className="payment-date__shortcuts">
            {shortcuts.map(({ label, day }) => (
              <button
                key={label}
                type="button"
                className="choice-chip"
                aria-pressed={value === day}
                onClick={() => onChange(day)}
              >
                {label}
              </button>
            ))}
          </div>
          <DateInput
            {...control}
            required
            className="payment-date__input"
            value={value}
            onChange={onChange}
          />
        </div>
      )}
    </FormField>
  );
}
