import { type ReactNode, useId } from 'react';

/** Accessibility wiring to spread onto the field's input. */
export interface FormControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}

interface FormFieldProps {
  label: string;
  error?: string;
  children: (control: FormControlProps) => ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </div>
  );
}
