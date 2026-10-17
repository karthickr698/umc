import { Controller, useWatch } from 'react-hook-form';
import { Check } from 'lucide-react';
import { FIELD_LIMITS } from '@umc/shared';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { Spinner } from '@/components/feedback/spinner';
import { ChoiceChips } from '@/components/forms/choice-chips';
import { FormField } from '@/components/forms/form-field';
import { SelectField } from '@/components/forms/select-field';
import { parseAmount } from '@/lib/money';
import { formatAmount } from '@/utils/format';
import { usePaymentEntryForm } from '../hooks/use-payment-entry-form';
import type { PaymentReference } from '../hooks/use-payment-reference';
import { needsReference, type PaymentEntryDefaults } from '../lib/payment-entry-schema';
import { PAYMENT_MODE_OPTIONS } from '@/lib/payment-modes';
import { PAYMENT_TYPE_OPTIONS } from '../lib/payment-options';
import type { PaymentReceipt } from '../lib/payment-receipt';
import { AmountField } from './amount-field';
import { PaymentDateField } from './payment-date-field';
import { WorkerPicker } from './worker-picker';

export interface PaymentEntryFormProps {
  reference: PaymentReference;
  /** Choices carried over from the last payment so repeat entries need fewer taps. */
  initial: PaymentEntryDefaults;
  onSaved: (receipt: PaymentReceipt) => void;
}

export function PaymentEntryForm({ reference, initial, onSaved }: PaymentEntryFormProps) {
  const { form, workers, saving, failure, dismissFailure, submit } = usePaymentEntryForm({
    reference,
    initial,
    onSaved,
  });
  const { control, register, setValue, setFocus, getValues, formState } = form;
  const { errors } = formState;
  const [siteId, workerKey, amount, paymentMode] = useWatch({
    control,
    name: ['siteId', 'workerKey', 'amount', 'paymentMode'],
  });

  const selectedWorker = workers.data?.find((worker) => worker.key === workerKey);
  const typedAmount = parseAmount(amount);

  return (
    <form className="payment-entry card" noValidate onSubmit={(event) => void submit(event)}>
      {failure && (
        <InlineAlert tone="error" title="Payment not saved" onDismiss={dismissFailure}>
          {failure}
        </InlineAlert>
      )}

      <Controller
        name="siteId"
        control={control}
        render={({ field, fieldState }) => (
          <SelectField
            label="Site"
            placeholder="Choose a site"
            value={field.value}
            options={reference.siteOptions}
            error={fieldState.error?.message}
            onBlur={field.onBlur}
            onChange={(value) => {
              field.onChange(value);
              setValue('workerKey', '');
            }}
          />
        )}
      />

      <Controller
        name="workerKey"
        control={control}
        render={({ field, fieldState }) => (
          <WorkerPicker
            workers={workers}
            siteChosen={siteId !== ''}
            value={field.value}
            error={fieldState.error?.message}
            onChange={(key) => {
              field.onChange(key);
              if (!getValues('amount')) setFocus('amount');
            }}
          />
        )}
      />

      <AmountField
        registration={register('amount')}
        error={errors.amount?.message}
        dueAmount={selectedWorker?.outstandingAmount}
        onFill={(value) => setValue('amount', value, { shouldValidate: formState.isSubmitted })}
      />

      <Controller
        name="paymentType"
        control={control}
        render={({ field, fieldState }) => (
          <ChoiceChips
            label="Payment type"
            value={field.value}
            options={PAYMENT_TYPE_OPTIONS}
            error={fieldState.error?.message}
            onChange={field.onChange}
          />
        )}
      />

      <Controller
        name="paymentMode"
        control={control}
        render={({ field, fieldState }) => (
          <ChoiceChips
            label="Payment mode"
            value={field.value}
            options={PAYMENT_MODE_OPTIONS}
            error={fieldState.error?.message}
            onChange={field.onChange}
          />
        )}
      />

      {needsReference(paymentMode) && (
        <FormField label="Reference no. (optional)" error={errors.referenceNumber?.message}>
          {(fieldControl) => (
            <input
              {...fieldControl}
              {...register('referenceNumber')}
              autoComplete="off"
              maxLength={FIELD_LIMITS.referenceNumber}
              placeholder="UTR, transaction or cheque number"
              className="field__input"
            />
          )}
        </FormField>
      )}

      <Controller
        name="paymentDate"
        control={control}
        render={({ field, fieldState }) => (
          <PaymentDateField
            value={field.value}
            error={fieldState.error?.message}
            onChange={field.onChange}
          />
        )}
      />

      <FormField label="Description (optional)" error={errors.description?.message}>
        {(fieldControl) => (
          <textarea
            {...fieldControl}
            {...register('description')}
            rows={2}
            maxLength={FIELD_LIMITS.description}
            placeholder="e.g. Week 2 wages, masonry work"
            className="field__input payment-entry__description"
          />
        )}
      </FormField>

      <div className="payment-entry__save">
        <button
          type="submit"
          className="button button--primary button--block payment-entry__submit"
          disabled={saving}
        >
          {saving ? <Spinner size={18} label="Saving" /> : <Check size={18} aria-hidden />}
          {typedAmount ? `Save payment · ${formatAmount(typedAmount)}` : 'Save payment'}
        </button>
      </div>
    </form>
  );
}
