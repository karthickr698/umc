import type { BoundField } from '@/hooks/use-entity-form';
import { TextField } from './text-field';

/** Large amount input with the numeric keypad on phones; commas are accepted. */
export function MoneyField({ label = 'Amount', ...props }: BoundField & { label?: string }) {
  return (
    <TextField
      label={label}
      required
      inputMode="decimal"
      autoComplete="off"
      placeholder="0.00"
      className="field__input--amount"
      {...props}
    />
  );
}
