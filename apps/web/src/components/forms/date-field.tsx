import { DateInput, type DateInputProps } from './date-input';
import { FormField } from './form-field';

export interface DateFieldProps extends Omit<
  DateInputProps,
  'id' | 'aria-invalid' | 'aria-describedby'
> {
  label: string;
  error?: string;
}

/** Labelled `DateInput`. */
export function DateField({ label, error, ...rest }: DateFieldProps) {
  return (
    <FormField label={label} error={error}>
      {(control) => <DateInput {...rest} {...control} />}
    </FormField>
  );
}
