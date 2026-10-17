import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  FIELD_LIMITS,
  type ContractorEmployeeDto,
  type CreateContractorEmployeeRequest,
  type UpdateContractorEmployeeRequest,
} from '@umc/shared';
import { changedFields, textError, toEnum, withoutEmpty, type DraftErrors } from '@/lib/form-draft';

export type ContractorEmployeeDraft = {
  contractorId: string;
  name: string;
  phone: string;
  status: string;
};

/** New workers start under `contractorId`, the contractor they are added for. */
export function toContractorEmployeeDraft(
  contractorId: string,
  worker?: ContractorEmployeeDto,
): ContractorEmployeeDraft {
  return {
    contractorId: worker?.contractorId ?? contractorId,
    name: worker?.name ?? '',
    phone: worker?.phone ?? '',
    status: worker?.status ?? CONTRACTOR_EMPLOYEE_STATUSES.ACTIVE,
  };
}

export function validateContractorEmployeeDraft(draft: ContractorEmployeeDraft) {
  const errors: DraftErrors<ContractorEmployeeDraft> = {
    contractorId: draft.contractorId ? undefined : 'Choose a contractor',
    name: textError(draft.name, { label: 'Name', max: FIELD_LIMITS.name, required: true }),
    phone: textError(draft.phone, { label: 'Phone', max: FIELD_LIMITS.phone }),
  };
  return errors;
}

function toRequest(draft: ContractorEmployeeDraft): CreateContractorEmployeeRequest {
  return {
    contractorId: draft.contractorId,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    status: toEnum(CONTRACTOR_EMPLOYEE_STATUSES, draft.status, CONTRACTOR_EMPLOYEE_STATUSES.ACTIVE),
  };
}

export function toCreateContractorEmployeeRequest(
  draft: ContractorEmployeeDraft,
): CreateContractorEmployeeRequest {
  const { contractorId, name, ...rest } = toRequest(draft);
  return { ...withoutEmpty(rest), contractorId, name };
}

export function toContractorEmployeeChanges(
  worker: ContractorEmployeeDto,
  draft: ContractorEmployeeDraft,
): UpdateContractorEmployeeRequest {
  return changedFields(
    toRequest(toContractorEmployeeDraft(worker.contractorId, worker)),
    toRequest(draft),
  );
}
