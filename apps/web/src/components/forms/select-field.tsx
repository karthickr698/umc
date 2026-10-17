import { FormField } from './form-field';
import { Select, type SelectProps } from './select';

export type { SelectOption } from './select';

export interface SelectFieldProps extends Omit<
  SelectProps,
  'id' | 'aria-invalid' | 'aria-describedby'
> {
  label: string;
  error?: string;
}

/** Labelled `Select`; an empty string value shows the placeholder. */
export function SelectField({ label, error, ...rest }: SelectFieldProps) {
  return (
    <FormField label={label} error={error}>
      {(control) => <Select {...rest} {...control} />}
    </FormField>
  );
}
