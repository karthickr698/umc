import {
  EMPLOYEE_STATUSES,
  FIELD_LIMITS,
  type CreateEmployeeRequest,
  type EmployeeDto,
  type UpdateEmployeeRequest,
} from '@umc/shared';
import {
  changedFields,
  dailyRateError,
  textError,
  toEnum,
  withoutEmpty,
  type DraftErrors,
} from '@/lib/form-draft';

export type EmployeeDraft = {
  name: string;
  role: string;
  phone: string;
  dailyRate: string;
  status: string;
  notes: string;
};

export function toEmployeeDraft(employee?: EmployeeDto): EmployeeDraft {
  return {
    name: employee?.name ?? '',
    role: employee?.role ?? '',
    phone: employee?.phone ?? '',
    dailyRate: employee ? String(employee.dailyRate) : '',
    status: employee?.status ?? EMPLOYEE_STATUSES.ACTIVE,
    notes: employee?.notes ?? '',
  };
}

export function validateEmployeeDraft(draft: EmployeeDraft) {
  const errors: DraftErrors<EmployeeDraft> = {
    name: textError(draft.name, { label: 'Name', max: FIELD_LIMITS.name, required: true }),
    role: textError(draft.role, { label: 'Role', max: FIELD_LIMITS.jobRole, required: true }),
    phone: textError(draft.phone, { label: 'Phone', max: FIELD_LIMITS.phone }),
    dailyRate: dailyRateError(draft.dailyRate),
    notes: textError(draft.notes, { label: 'Notes', max: FIELD_LIMITS.notes }),
  };
  return errors;
}

function toRequest(draft: EmployeeDraft): CreateEmployeeRequest {
  return {
    name: draft.name.trim(),
    role: draft.role.trim(),
    phone: draft.phone.trim(),
    dailyRate: Number(draft.dailyRate),
    status: toEnum(EMPLOYEE_STATUSES, draft.status, EMPLOYEE_STATUSES.ACTIVE),
    notes: draft.notes.trim(),
  };
}

export function toCreateEmployeeRequest(draft: EmployeeDraft): CreateEmployeeRequest {
  const { name, role, dailyRate, ...rest } = toRequest(draft);
  return { ...withoutEmpty(rest), name, role, dailyRate };
}

export function toEmployeeChanges(
  employee: EmployeeDto,
  draft: EmployeeDraft,
): UpdateEmployeeRequest {
  return changedFields(toRequest(toEmployeeDraft(employee)), toRequest(draft));
}
