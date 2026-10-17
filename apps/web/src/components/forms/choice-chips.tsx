import { useId } from 'react';

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
}

export interface ChoiceChipsProps<V extends string> {
  label: string;
  value: V | undefined;
  options: readonly ChoiceOption<V>[];
  onChange: (value: V) => void;
  error?: string;
}

/** Single-choice radio group rendered as tappable chips; one tap instead of opening a select. */
export function ChoiceChips<V extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: ChoiceChipsProps<V>) {
  const name = useId();
  const errorId = `${name}-error`;

  return (
    <fieldset
      className="field field-group choice-chips"
      aria-invalid={Boolean(error)}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="field__label">{label}</legend>
      <div className="choice-chips__options">
        {options.map((option) => (
          <label key={option.value} className="choice-chip">
            <input
              type="radio"
              className="choice-chip__input"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="field__error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
