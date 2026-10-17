import { useParams } from 'react-router';
import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  FIELD_LIMITS,
  type ContractorDto,
  type ContractorEmployeeDto,
} from '@umc/shared';
import { PhoneField } from '@/components/forms/contact-fields';
import { EntityForm } from '@/components/forms/entity-form';
import { SelectField } from '@/components/forms/select-field';
import { TextField } from '@/components/forms/text-field';
import type { ResourceFormProps } from '@/components/pages/resource-list-page';
import { useEntityForm } from '@/hooks/use-entity-form';
import { useAllPagesSelectOptions } from '@/hooks/use-select-options';
import { createResource, RESOURCE_API, updateResource } from '@/lib/resource-api';
import { enumOptions, namedOption } from '@/lib/select-options';
import {
  toContractorEmployeeChanges,
  toContractorEmployeeDraft,
  toCreateContractorEmployeeRequest,
  validateContractorEmployeeDraft,
} from '../lib/contractor-employee-form';

const STATUS_OPTIONS = enumOptions(CONTRACTOR_EMPLOYEE_STATUSES);

export interface ContractorEmployeeFormProps extends ResourceFormProps<ContractorEmployeeDto> {
  /** Contractor new workers belong to; defaults to the one in the URL (its workers page). */
  contractorId?: string;
}

export function ContractorEmployeeForm({
  item: worker,
  contractorId,
  onSaved,
  onCancel,
}: ContractorEmployeeFormProps) {
  const { contractorId: routeContractorId = '' } = useParams();
  const contractors = useAllPagesSelectOptions<ContractorDto>(
    RESOURCE_API.contractors.base,
    namedOption,
  );
  const form = useEntityForm({
    initial: toContractorEmployeeDraft(contractorId ?? routeContractorId, worker),
    validate: validateContractorEmployeeDraft,
    submit: (draft) =>
      worker
        ? updateResource(
            RESOURCE_API.contractorEmployees,
            worker,
            toContractorEmployeeChanges(worker, draft),
          )
        : createResource<ContractorEmployeeDto>(
            RESOURCE_API.contractorEmployees,
            toCreateContractorEmployeeRequest(draft),
          ),
    onSaved,
  });
  const { bind } = form;

  return (
    <EntityForm
      form={form}
      submitLabel={worker ? 'Save changes' : 'Add worker'}
      requireChanges={Boolean(worker)}
      onCancel={onCancel}
    >
      <TextField label="Name" required maxLength={FIELD_LIMITS.name} {...bind('name')} />
      <div className="entity-form__row">
        <PhoneField {...bind('phone')} />
        <SelectField label="Status" options={STATUS_OPTIONS} {...bind('status')} />
      </div>
      {worker && (
        <SelectField
          label="Contractor"
          required
          placeholder={contractors.loading ? 'Loading contractors…' : 'Choose a contractor'}
          options={contractors.options}
          {...bind('contractorId')}
        />
      )}
    </EntityForm>
  );
}
