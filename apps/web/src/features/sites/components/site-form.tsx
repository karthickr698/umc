import { FIELD_LIMITS, SITE_STATUSES, type SiteDto } from '@umc/shared';
import { AddressFields } from '@/components/forms/address-fields';
import { DateField } from '@/components/forms/date-field';
import { EntityForm } from '@/components/forms/entity-form';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import type { ResourceFormProps } from '@/components/pages/resource-list-page';
import { useEntityForm } from '@/hooks/use-entity-form';
import { createResource, RESOURCE_API, updateResource } from '@/lib/resource-api';
import { enumOptions } from '@/lib/select-options';
import { useClientOptions } from '@/hooks/use-record-options';
import {
  toCreateSiteRequest,
  toSiteChanges,
  toSiteDraft,
  validateSiteDraft,
} from '../lib/site-form';

const STATUS_OPTIONS = enumOptions(SITE_STATUSES);

function clientPlaceholder({ loading, failed }: { loading: boolean; failed: boolean }) {
  if (loading) return 'Loading clients…';
  return failed ? 'Clients could not be loaded' : 'Choose a client';
}

export function SiteForm({ item: site, onSaved, onCancel }: ResourceFormProps<SiteDto>) {
  const clients = useClientOptions();
  const form = useEntityForm({
    initial: toSiteDraft(site),
    validate: (draft) => validateSiteDraft(draft, site),
    submit: (draft) =>
      site
        ? updateResource(RESOURCE_API.sites, site, toSiteChanges(site, draft))
        : createResource<SiteDto>(RESOURCE_API.sites, toCreateSiteRequest(draft)),
    onSaved,
  });
  const { bind } = form;

  return (
    <EntityForm
      form={form}
      submitLabel={site ? 'Save changes' : 'Add site'}
      requireChanges={Boolean(site)}
      onCancel={onCancel}
    >
      <TextField label="Name" required maxLength={FIELD_LIMITS.name} {...bind('name')} />
      <SelectField
        label="Client"
        required
        placeholder={clientPlaceholder(clients)}
        options={clients.options}
        {...bind('clientId')}
      />
      <div className="entity-form__row">
        <SelectField label="Status" options={STATUS_OPTIONS} {...bind('status')} />
        <DateField label="Start date" placeholder="Not set" {...bind('startDate')} />
      </div>
      <AddressFields bind={bind} />
    </EntityForm>
  );
}
