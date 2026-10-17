import {
  CLIENT_STATUSES,
  FIELD_LIMITS,
  type ClientDto,
  type CreateClientRequest,
  type UpdateClientRequest,
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

export type ClientDraft = AddressDraft & {
  name: string;
  phone: string;
  email: string;
  status: string;
};

export function toClientDraft(client?: ClientDto): ClientDraft {
  return {
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    status: client?.status ?? CLIENT_STATUSES.ACTIVE,
    ...toAddressDraft(client?.address),
  };
}

export function validateClientDraft(draft: ClientDraft, client?: ClientDto) {
  const errors: DraftErrors<ClientDraft> = {
    name: textError(draft.name, { label: 'Name', max: FIELD_LIMITS.name, required: true }),
    phone: textError(draft.phone, { label: 'Phone', max: FIELD_LIMITS.phone }),
    email: emailError(draft.email, client?.email),
    ...validateAddress(draft),
  };
  return errors;
}

function toRequest(draft: ClientDraft): CreateClientRequest {
  const email = draft.email.trim();
  return {
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    ...(email && { email }),
    address: toAddress(draft),
    status: toEnum(CLIENT_STATUSES, draft.status, CLIENT_STATUSES.ACTIVE),
  };
}

export function toCreateClientRequest(draft: ClientDraft): CreateClientRequest {
  const request = toRequest(draft);
  return { ...withoutEmpty(request), name: request.name };
}

export function toClientChanges(client: ClientDto, draft: ClientDraft): UpdateClientRequest {
  return changedFields(toRequest(toClientDraft(client)), toRequest(draft));
}
