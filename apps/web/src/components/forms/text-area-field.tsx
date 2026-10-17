import type { TextareaHTMLAttributes } from 'react';
import { FormField } from './form-field';

export interface TextAreaFieldProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id' | 'value' | 'onChange'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TextAreaField({
  label,
  value,
  onChange,
  error,
  className,
  rows = 3,
  ...rest
}: TextAreaFieldProps) {
  return (
    <FormField label={label} error={error}>
      {(control) => (
        <textarea
          {...rest}
          {...control}
          rows={rows}
          className={['field__input field__input--multiline', className].filter(Boolean).join(' ')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}
