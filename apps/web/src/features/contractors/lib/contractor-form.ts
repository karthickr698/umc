import {
  CONTRACTOR_CATEGORIES,
  CONTRACTOR_STATUSES,
  FIELD_LIMITS,
  type ContractorDto,
  type CreateContractorRequest,
  type UpdateContractorRequest,
} from '@umc/shared';
import { toAddress, toAddressDraft, validateAddress, type AddressDraft } from '@/lib/address-draft';
import {
  changedFields,
  emailError,
  textError,
  toEnum,
  withoutEmpty,
  type DraftErrors,
} from '@/lib/form-draft';

export type ContractorDraft = AddressDraft & {
  name: string;
  category: string;
  phone: string;
  email: string;
  status: string;
  notes: string;
};

export function toContractorDraft(contractor?: ContractorDto): ContractorDraft {
  return {
    name: contractor?.name ?? '',
    category: contractor?.category ?? '',
    phone: contractor?.phone ?? '',
    email: contractor?.email ?? '',
    status: contractor?.status ?? CONTRACTOR_STATUSES.ACTIVE,
    notes: contractor?.notes ?? '',
    ...toAddressDraft(contractor?.address),
  };
}

export function validateContractorDraft(draft: ContractorDraft, contractor?: ContractorDto) {
  const errors: DraftErrors<ContractorDraft> = {
    name: textError(draft.name, { label: 'Name', max: FIELD_LIMITS.name, required: true }),
    category: draft.category ? undefined : 'Choose a trade',
    phone: textError(draft.phone, { label: 'Phone', max: FIELD_LIMITS.phone }),
    email: emailError(draft.email, contractor?.email),
    notes: textError(draft.notes, { label: 'Notes', max: FIELD_LIMITS.notes }),
    ...validateAddress(draft),
  };
  return errors;
}

function toRequest(draft: ContractorDraft): CreateContractorRequest {
  const email = draft.email.trim();
  return {
    name: draft.name.trim(),
    category: toEnum(CONTRACTOR_CATEGORIES, draft.category, CONTRACTOR_CATEGORIES.OTHER),
    phone: draft.phone.trim(),
    ...(email && { email }),
    address: toAddress(draft),
    status: toEnum(CONTRACTOR_STATUSES, draft.status, CONTRACTOR_STATUSES.ACTIVE),
    notes: draft.notes.trim(),
  };
}

export function toCreateContractorRequest(draft: ContractorDraft): CreateContractorRequest {
  const { name, category, ...rest } = toRequest(draft);
  return { ...withoutEmpty(rest), name, category };
}

export function toContractorChanges(
  contractor: ContractorDto,
  draft: ContractorDraft,
): UpdateContractorRequest {
  return changedFields(toRequest(toContractorDraft(contractor)), toRequest(draft));
}
