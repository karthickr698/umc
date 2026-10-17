import type { InputHTMLAttributes } from 'react';
import { FormField } from './form-field';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'value' | 'onChange'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** Labelled single-line input; also for numbers, dates, emails and phones via `type`. */
export function TextField({ label, value, onChange, error, className, ...rest }: TextFieldProps) {
  return (
    <FormField label={label} error={error}>
      {(control) => (
        <input
          {...rest}
          {...control}
          className={['field__input', className].filter(Boolean).join(' ')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}
