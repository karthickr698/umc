import { EMPLOYEE_STATUSES, FIELD_LIMITS, type EmployeeDto } from '@umc/shared';
import { PhoneField } from '@/components/forms/contact-fields';
import { DailyRateField } from '@/components/forms/daily-rate-field';
import { EntityForm } from '@/components/forms/entity-form';
import { SelectField } from '@/components/forms/select-field';
import { TextAreaField } from '@/components/forms/text-area-field';
import { TextField } from '@/components/forms/text-field';
import type { ResourceFormProps } from '@/components/pages/resource-list-page';
import { useEntityForm } from '@/hooks/use-entity-form';
import { createResource, RESOURCE_API, updateResource } from '@/lib/resource-api';
import { enumOptions } from '@/lib/select-options';
import {
  toCreateEmployeeRequest,
  toEmployeeChanges,
  toEmployeeDraft,
  validateEmployeeDraft,
} from '../lib/employee-form';

const STATUS_OPTIONS = enumOptions(EMPLOYEE_STATUSES);

export function EmployeeForm({
  item: employee,
  onSaved,
  onCancel,
}: ResourceFormProps<EmployeeDto>) {
  const form = useEntityForm({
    initial: toEmployeeDraft(employee),
    validate: validateEmployeeDraft,
    submit: (draft) =>
      employee
        ? updateResource(RESOURCE_API.employees, employee, toEmployeeChanges(employee, draft))
        : createResource<EmployeeDto>(RESOURCE_API.employees, toCreateEmployeeRequest(draft)),
    onSaved,
  });
  const { bind } = form;

  return (
    <EntityForm
      form={form}
      submitLabel={employee ? 'Save changes' : 'Add employee'}
      requireChanges={Boolean(employee)}
      onCancel={onCancel}
    >
      <TextField label="Name" required maxLength={FIELD_LIMITS.name} {...bind('name')} />
      <TextField
        label="Role"
        required
        maxLength={FIELD_LIMITS.jobRole}
        placeholder="e.g. Mason"
        {...bind('role')}
      />
      <div className="entity-form__row">
        <DailyRateField {...bind('dailyRate')} />
        <PhoneField {...bind('phone')} />
      </div>
      <SelectField label="Status" options={STATUS_OPTIONS} {...bind('status')} />
      <TextAreaField
        label="Notes"
        placeholder="Optional"
        maxLength={FIELD_LIMITS.notes}
        {...bind('notes')}
      />
    </EntityForm>
  );
}
