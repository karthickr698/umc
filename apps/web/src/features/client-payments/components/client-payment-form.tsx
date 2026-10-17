import { FIELD_LIMITS, type ClientPaymentDto } from '@umc/shared';
import { ChoiceChips } from '@/components/forms/choice-chips';
import { DateField } from '@/components/forms/date-field';
import { EntityForm } from '@/components/forms/entity-form';
import { MissingRecordsHint } from '@/components/forms/missing-records-hint';
import { MoneyField } from '@/components/forms/money-field';
import { SelectField } from '@/components/forms/select-field';
import { TextAreaField } from '@/components/forms/text-area-field';
import { TextField } from '@/components/forms/text-field';
import type { ResourceFormProps } from '@/components/pages/resource-list-view';
import { APP_ROUTES } from '@/config/routes';
import { useEntityForm } from '@/hooks/use-entity-form';
import { useClientOptions, useSiteOptions } from '@/hooks/use-record-options';
import { PAYMENT_MODE_OPTIONS } from '@/lib/payment-modes';
import { createResource, RESOURCE_API, updateResource } from '@/lib/resource-api';
import { toCalendarDate, today } from '@/utils/calendar-date';
import {
  toClientPaymentChanges,
  toClientPaymentDraft,
  toCreateClientPaymentRequest,
  validateClientPaymentDraft,
} from '../lib/client-payment-form';

export function ClientPaymentForm({
  item: payment,
  onSaved,
  onCancel,
}: ResourceFormProps<ClientPaymentDto>) {
  const form = useEntityForm({
    initial: toClientPaymentDraft(payment),
    validate: validateClientPaymentDraft,
    submit: (draft) =>
      payment
        ? updateResource(
            RESOURCE_API.clientPayments,
            payment,
            toClientPaymentChanges(payment, draft),
          )
        : createResource<ClientPaymentDto>(
            RESOURCE_API.clientPayments,
            toCreateClientPaymentRequest(draft),
          ),
    onSaved,
  });
  const { bind, set, draft } = form;
  const clients = useClientOptions();
  const sites = useSiteOptions(draft.clientId || undefined);

  return (
    <EntityForm
      form={form}
      submitLabel={payment ? 'Save changes' : 'Save payment'}
      requireChanges={Boolean(payment)}
      onCancel={onCancel}
    >
      <MissingRecordsHint source={clients} noun="clients" path={APP_ROUTES.clients} />
      <SelectField
        label="Received from"
        required
        placeholder={clients.loading ? 'Loading clients…' : 'Choose a client'}
        options={clients.options}
        {...bind('clientId')}
        onChange={(clientId) => {
          set('clientId', clientId);
          // A site belongs to one client, so the previous pick may not fit the new client.
          set('siteId', '');
        }}
      />
      <SelectField
        label="For which site?"
        placeholder="Not for a specific site"
        options={sites.options}
        disabled={!draft.clientId}
        {...bind('siteId')}
      />
      <MoneyField label="Amount received" {...bind('amount')} />
      <DateField
        label="Date received"
        required
        max={toCalendarDate(today())}
        {...bind('receivedDate')}
      />
      <ChoiceChips label="Received by" options={PAYMENT_MODE_OPTIONS} {...bind('paymentMode')} />
      <TextField
        label="Reference number"
        placeholder="Optional, e.g. UPI or cheque number"
        maxLength={FIELD_LIMITS.referenceNumber}
        {...bind('referenceNumber')}
      />
      <TextAreaField
        label="Note"
        placeholder="Optional"
        maxLength={FIELD_LIMITS.description}
        {...bind('description')}
      />
    </EntityForm>
  );
}
