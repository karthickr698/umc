import type { UseFormRegisterReturn } from 'react-hook-form';
import { FormField } from '@/components/forms/form-field';
import { formatAmount } from '@/utils/format';

export interface AmountFieldProps {
  registration: UseFormRegisterReturn<'amount'>;
  error?: string;
  /** The chosen worker's outstanding balance at the site, offered as a one-tap fill. */
  dueAmount?: number;
  onFill: (amount: string) => void;
}

export function AmountField({ registration, error, dueAmount, onFill }: AmountFieldProps) {
  return (
    <FormField label="Amount" error={error}>
      {(control) => (
        <div className="amount-field">
          <input
            {...control}
            {...registration}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="next"
            placeholder="0.00"
            className="field__input amount-field__input"
          />
          {dueAmount !== undefined && dueAmount > 0 && (
            <button
              type="button"
              className="button button--small amount-field__fill"
              onClick={() => onFill(dueAmount.toFixed(2))}
            >
              Pay full due · {formatAmount(dueAmount)}
            </button>
          )}
        </div>
      )}
    </FormField>
  );
}
