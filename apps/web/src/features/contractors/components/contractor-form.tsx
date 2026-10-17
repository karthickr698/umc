import {
  CONTRACTOR_CATEGORIES,
  CONTRACTOR_STATUSES,
  FIELD_LIMITS,
  type ContractorDto,
} from '@umc/shared';
import { AddressFields } from '@/components/forms/address-fields';
import { EmailField, PhoneField } from '@/components/forms/contact-fields';
import { EntityForm } from '@/components/forms/entity-form';
import { SelectField } from '@/components/forms/select-field';
import { TextAreaField } from '@/components/forms/text-area-field';
import { TextField } from '@/components/forms/text-field';
import type { ResourceFormProps } from '@/components/pages/resource-list-page';
import { useEntityForm } from '@/hooks/use-entity-form';
import { createResource, RESOURCE_API, updateResource } from '@/lib/resource-api';
import { enumOptions } from '@/lib/select-options';
import {
  toContractorChanges,
  toContractorDraft,
  toCreateContractorRequest,
  validateContractorDraft,
} from '../lib/contractor-form';

const CATEGORY_OPTIONS = enumOptions(CONTRACTOR_CATEGORIES);
const STATUS_OPTIONS = enumOptions(CONTRACTOR_STATUSES);

export function ContractorForm({
  item: contractor,
  onSaved,
  onCancel,
}: ResourceFormProps<ContractorDto>) {
  const form = useEntityForm({
    initial: toContractorDraft(contractor),
    validate: (draft) => validateContractorDraft(draft, contractor),
    submit: (draft) =>
      contractor
        ? updateResource(
            RESOURCE_API.contractors,
            contractor,
            toContractorChanges(contractor, draft),
          )
        : createResource<ContractorDto>(RESOURCE_API.contractors, toCreateContractorRequest(draft)),
    onSaved,
  });
  const { bind } = form;

  return (
    <EntityForm
      form={form}
      submitLabel={contractor ? 'Save changes' : 'Add contractor'}
      requireChanges={Boolean(contractor)}
      onCancel={onCancel}
    >
      <TextField label="Name" required maxLength={FIELD_LIMITS.name} {...bind('name')} />
      <div className="entity-form__row">
        <SelectField
          label="Trade"
          required
          placeholder="Choose a trade"
          options={CATEGORY_OPTIONS}
          {...bind('category')}
        />
        <SelectField label="Status" options={STATUS_OPTIONS} {...bind('status')} />
      </div>
      <div className="entity-form__row">
        <PhoneField {...bind('phone')} />
        <EmailField {...bind('email')} />
      </div>
      <AddressFields bind={bind} />
      <TextAreaField
        label="Notes"
        placeholder="Optional"
        maxLength={FIELD_LIMITS.notes}
        {...bind('notes')}
      />
    </EntityForm>
  );
}
