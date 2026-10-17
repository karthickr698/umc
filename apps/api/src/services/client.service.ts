import type { ClientDto, Paginated, TenantUserDto } from '@umc/shared';
import * as clientPaymentRepository from '../repositories/client-payment.repository.js';
import * as clientRepository from '../repositories/client.repository.js';
import type { ClientRecord } from '../repositories/client.repository.js';
import * as siteRepository from '../repositories/site.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateClientInput,
  ListClientsInput,
  UpdateClientInput,
} from '../validators/client.validator.js';

const CLIENT_NOT_FOUND = 'Client not found';

export function toClientDto(client: ClientRecord): ClientDto {
  return {
    id: client._id.toString(),
    companyId: client.companyId.toString(),
    name: client.name,
    ...(client.phone !== undefined && { phone: client.phone }),
    ...(client.email !== undefined && { email: client.email }),
    ...(client.address !== undefined && { address: client.address }),
    status: client.status,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

/** Owning company of a client, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return clientRepository.findCompanyIdById(id);
}

/** A client from another company is reported as missing so its id cannot be probed. */
export async function assertClientInCompany(companyId: string, clientId: string): Promise<void> {
  if (!(await clientRepository.existsInCompany(companyId, clientId))) {
    throw ApiError.validation([{ path: 'clientId', message: CLIENT_NOT_FOUND }]);
  }
}

export async function list(
  actor: TenantUserDto,
  query: ListClientsInput,
): Promise<Paginated<ClientDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await clientRepository.listByCompany(
    actor.companyId,
    filter,
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(items.map(toClientDto), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<ClientDto> {
  const client = await clientRepository.findByIdInCompany(actor.companyId, id);
  if (!client) throw ApiError.notFound(CLIENT_NOT_FOUND);
  return toClientDto(client);
}

/** The new client always belongs to the actor's company. */
export async function create(actor: TenantUserDto, input: CreateClientInput): Promise<ClientDto> {
  const client = await clientRepository.create({ ...input, companyId: actor.companyId });
  return toClientDto(client);
}

export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateClientInput,
): Promise<ClientDto> {
  const updated = await clientRepository.updateInCompany(actor.companyId, id, input);
  if (!updated) throw ApiError.notFound(CLIENT_NOT_FOUND);
  return toClientDto(updated);
}

/** Refused while sites or receipts still reference the client, so none point at a missing one. */
export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  if (await siteRepository.existsForClient(actor.companyId, id)) {
    throw ApiError.conflict('Client still has sites; reassign or delete them first');
  }
  if (await clientPaymentRepository.existsForClient(actor.companyId, id)) {
    throw ApiError.conflict('Client still has client payments; delete them first');
  }
  const deleted = await clientRepository.deleteInCompany(actor.companyId, id);
  if (!deleted) throw ApiError.notFound(CLIENT_NOT_FOUND);
}
