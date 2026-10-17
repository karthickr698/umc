import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker, type Matcher } from 'react-day-picker';
import { CalendarDays, X } from 'lucide-react';
import { PopoverPanel } from '@/components/layout/popover-panel';
import {
  addDays,
  isCalendarDate,
  parseCalendarDate,
  toCalendarDate,
  today,
} from '@/utils/calendar-date';
import { formatLongDay } from '@/utils/format';

export interface DateInputProps {
  /** `YYYY-MM-DD`, or empty when no day is chosen. */
  value: string;
  onChange: (day: string) => void;
  /** Without `required` an empty value is allowed and a "Clear" button is offered. */
  required?: boolean;
  /** Earliest and latest selectable days, `YYYY-MM-DD`. */
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

const toDay = (value: string) => (isCalendarDate(value) ? parseCalendarDate(value) : undefined);

/** A button showing the chosen day that opens a calendar, with one-tap "Today"/"Yesterday". */
export function DateInput({
  value,
  onChange,
  required = false,
  min,
  max,
  placeholder = 'Pick a date',
  disabled = false,
  id,
  className,
  ...aria
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const selected = toDay(value);
  const minDay = min ? toDay(min) : undefined;
  const maxDay = max ? toDay(max) : undefined;
  const disabledDays: Matcher[] = [
    ...(minDay ? [{ before: minDay }] : []),
    ...(maxDay ? [{ after: maxDay }] : []),
  ];
  const inRange = (day: string) => (!min || day >= min) && (!max || day <= max);

  const shortcuts = [
    { label: 'Today', day: toCalendarDate(today()) },
    { label: 'Yesterday', day: toCalendarDate(addDays(today(), -1)) },
  ].filter(({ day }) => inRange(day));

  const pick = (day: string) => {
    onChange(day);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          {...aria}
          id={id}
          type="button"
          className={['field__input select__trigger', className].filter(Boolean).join(' ')}
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
        >
          <CalendarDays className="date-input__icon" size={18} aria-hidden />
          <span className={`select__value${selected ? '' : ' select__value--placeholder'}`}>
            {selected ? formatLongDay(value) : placeholder}
          </span>
        </button>
      </Popover.Trigger>
      <PopoverPanel className="date-input__panel">
        <DayPicker
          mode="single"
          required={required}
          selected={selected}
          defaultMonth={selected ?? maxDay ?? today()}
          startMonth={minDay}
          endMonth={maxDay}
          disabled={disabledDays}
          weekStartsOn={1}
          autoFocus
          onSelect={(day: Date | undefined) => pick(day ? toCalendarDate(day) : '')}
        />
        <div className="date-input__footer">
          {shortcuts.map(({ label, day }) => (
            <button
              key={label}
              type="button"
              className="choice-chip date-input__shortcut"
              aria-pressed={value === day}
              onClick={() => pick(day)}
            >
              {label}
            </button>
          ))}
          {!required && value && (
            <button
              type="button"
              className="button button--ghost button--small date-input__clear"
              onClick={() => pick('')}
            >
              <X size={14} aria-hidden />
              Clear
            </button>
          )}
        </div>
      </PopoverPanel>
    </Popover.Root>
  );
}
