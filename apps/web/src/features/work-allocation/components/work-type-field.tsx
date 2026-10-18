import { useId } from 'react';
import { FIELD_LIMITS } from '@umc/shared';

const MAX_SUGGESTIONS = 8;

export interface WorkTypeFieldProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  /** Whether a blank value falls back to each employee's role. */
  optional: boolean;
  /** Id of the heading that names the field. */
  labelledBy: string;
}

/** Free-text work type with one-tap suggestions from known roles and the day's assignments. */
export function WorkTypeField({
  value,
  onChange,
  suggestions,
  optional,
  labelledBy,
}: WorkTypeFieldProps) {
  const listId = useId();
  const chosen = value.trim().toLowerCase();

  return (
    <div className="work-type-field">
      <input
        className="field__input"
        aria-labelledby={labelledBy}
        list={listId}
        maxLength={FIELD_LIMITS.workType}
        placeholder={
          optional ? "Leave empty to use each employee's job" : 'e.g. Masonry, Plastering'
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
      {suggestions.length > 0 && (
        <div className="work-type-field__suggestions" role="group" aria-label="Common work types">
          {suggestions.slice(0, MAX_SUGGESTIONS).map((suggestion) => {
            const active = suggestion.toLowerCase() === chosen;
            return (
              <button
                key={suggestion}
                type="button"
                className="choice-chip work-type-field__chip"
                aria-pressed={active}
                onClick={() => onChange(active ? '' : suggestion)}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
