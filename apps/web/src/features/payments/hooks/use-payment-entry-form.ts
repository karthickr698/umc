import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { siteLabel } from '@/lib/sites';
import { describePaymentEntryError } from '../lib/payment-entry-error';
import {
  paymentEntrySchema,
  toCreatePaymentRequest,
  toDefaultValues,
  type PaymentEntryDefaults,
  type PaymentEntryField,
  type PaymentEntryValues,
} from '../lib/payment-entry-schema';
import { savePaymentPreferences } from '../lib/payment-preferences';
import type { PaymentReceipt } from '../lib/payment-receipt';
import { useCreatePayment } from './use-create-payment';
import type { PaymentReference } from './use-payment-reference';
import { useSiteWorkers } from './use-site-workers';

/** A remembered site that no longer exists is dropped; a company with one site gets it preset. */
function resolveDefaults(
  reference: PaymentReference,
  initial: PaymentEntryDefaults,
): PaymentEntryValues {
  const { siteOptions, sitesById } = reference;
  const known = initial.siteId !== undefined && sitesById.has(initial.siteId);
  const onlySite = siteOptions.length === 1 ? siteOptions[0]?.value : undefined;
  return toDefaultValues({ ...initial, siteId: known ? initial.siteId : onlySite });
}

export interface UsePaymentEntryFormOptions {
  reference: PaymentReference;
  initial: PaymentEntryDefaults;
  onSaved: (receipt: PaymentReceipt) => void;
}

export function usePaymentEntryForm({ reference, initial, onSaved }: UsePaymentEntryFormOptions) {
  const form = useForm<PaymentEntryValues>({
    resolver: zodResolver(paymentEntrySchema),
    defaultValues: resolveDefaults(reference, initial),
  });
  const create = useCreatePayment();
  const [failure, setFailure] = useState<string | null>(null);

  const siteId = useWatch({ control: form.control, name: 'siteId' });
  const workers = useSiteWorkers(siteId, reference.contractorNames);

  const submit = form.handleSubmit(async (values) => {
    setFailure(null);
    try {
      const payment = await create.mutateAsync(toCreatePaymentRequest(values));
      savePaymentPreferences({ siteId: values.siteId, paymentMode: values.paymentMode });
      const worker = workers.data?.find((item) => item.key === values.workerKey);
      onSaved({
        payment,
        workerName: worker?.name ?? 'Worker',
        workerCode: worker?.code ?? '—',
        contractorName: worker?.contractorName,
        siteName: siteLabel(reference.sitesById.get(values.siteId)),
      });
    } catch (error) {
      const described = describePaymentEntryError(error);
      setFailure(described.message);
      const entries = Object.entries(described.fieldErrors) as [PaymentEntryField, string][];
      entries.forEach(([field, message], index) =>
        form.setError(field, { type: 'server', message }, { shouldFocus: index === 0 }),
      );
    }
  });

  return {
    form,
    workers,
    saving: create.isPending,
    failure,
    dismissFailure: () => setFailure(null),
    submit,
  };
}
