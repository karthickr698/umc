import { useId } from 'react';
import { FIELD_LIMITS } from '@umc/shared';
import { FormField } from '@/components/forms/form-field';

export interface WorkTypeFieldProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  /** Whether a blank value falls back to each employee's role. */
  optional: boolean;
}

/** Free-text work type with suggestions from known roles and the day's other assignments. */
export function WorkTypeField({ value, onChange, suggestions, optional }: WorkTypeFieldProps) {
  const listId = useId();

  return (
    <FormField label="Work type">
      {(control) => (
        <>
          <input
            {...control}
            className="field__input"
            list={listId}
            maxLength={FIELD_LIMITS.workType}
            placeholder={optional ? "Leave blank for each employee's role" : 'e.g. Masonry'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <datalist id={listId}>
            {suggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </>
      )}
    </FormField>
  );
}
