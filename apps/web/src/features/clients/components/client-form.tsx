import { CLIENT_STATUSES, FIELD_LIMITS, type ClientDto } from '@umc/shared';
import { AddressFields } from '@/components/forms/address-fields';
import { EmailField, PhoneField } from '@/components/forms/contact-fields';
import { EntityForm } from '@/components/forms/entity-form';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import type { ResourceFormProps } from '@/components/pages/resource-list-page';
import { useEntityForm } from '@/hooks/use-entity-form';
import { createResource, RESOURCE_API, updateResource } from '@/lib/resource-api';
import { enumOptions } from '@/lib/select-options';
import {
  toClientChanges,
  toClientDraft,
  toCreateClientRequest,
  validateClientDraft,
} from '../lib/client-form';

const STATUS_OPTIONS = enumOptions(CLIENT_STATUSES);

export function ClientForm({ item: client, onSaved, onCancel }: ResourceFormProps<ClientDto>) {
  const form = useEntityForm({
    initial: toClientDraft(client),
    validate: (draft) => validateClientDraft(draft, client),
    submit: (draft) =>
      client
        ? updateResource(RESOURCE_API.clients, client, toClientChanges(client, draft))
        : createResource<ClientDto>(RESOURCE_API.clients, toCreateClientRequest(draft)),
    onSaved,
  });
  const { bind } = form;

  return (
    <EntityForm
      form={form}
      submitLabel={client ? 'Save changes' : 'Add client'}
      requireChanges={Boolean(client)}
      onCancel={onCancel}
    >
      <TextField label="Name" required maxLength={FIELD_LIMITS.name} {...bind('name')} />
      <div className="entity-form__row">
        <PhoneField {...bind('phone')} />
        <EmailField {...bind('email')} />
      </div>
      <SelectField label="Status" options={STATUS_OPTIONS} {...bind('status')} />
      <AddressFields bind={bind} />
    </EntityForm>
  );
}
