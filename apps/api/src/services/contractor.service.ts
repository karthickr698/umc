import type { ContractorDto, Paginated, TenantUserDto } from '@umc/shared';
import * as contractorEmployeeRepository from '../repositories/contractor-employee.repository.js';
import * as contractorRepository from '../repositories/contractor.repository.js';
import type { ContractorRecord } from '../repositories/contractor.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import type {
  CreateContractorInput,
  ListContractorsInput,
  UpdateContractorInput,
} from '../validators/contractor.validator.js';

const CONTRACTOR_NOT_FOUND = 'Contractor not found';

export function toContractorDto(contractor: ContractorRecord): ContractorDto {
  return {
    id: contractor._id.toString(),
    companyId: contractor.companyId.toString(),
    name: contractor.name,
    ...(contractor.phone !== undefined && { phone: contractor.phone }),
    ...(contractor.email !== undefined && { email: contractor.email }),
    category: contractor.category,
    ...(contractor.address !== undefined && { address: contractor.address }),
    status: contractor.status,
    ...(contractor.notes !== undefined && { notes: contractor.notes }),
    createdAt: contractor.createdAt.toISOString(),
    updatedAt: contractor.updatedAt.toISOString(),
  };
}

/** Owning company of a contractor, for `requireCompanyOwnership`; `null` when it does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return contractorRepository.findCompanyIdById(id);
}

/** A contractor from another company is reported as missing so its id cannot be probed. */
export async function assertContractorInCompany(
  companyId: string,
  contractorId: string,
): Promise<void> {
  if (!(await contractorRepository.existsInCompany(companyId, contractorId))) {
    throw ApiError.validation([{ path: 'contractorId', message: CONTRACTOR_NOT_FOUND }]);
  }
}

export async function list(
  actor: TenantUserDto,
  query: ListContractorsInput,
): Promise<Paginated<ContractorDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await contractorRepository.listByCompany(
    actor.companyId,
    filter,
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(items.map(toContractorDto), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<ContractorDto> {
  const contractor = await contractorRepository.findByIdInCompany(actor.companyId, id);
  if (!contractor) throw ApiError.notFound(CONTRACTOR_NOT_FOUND);
  return toContractorDto(contractor);
}

/** The new contractor always belongs to the actor's company. */
export async function create(
  actor: TenantUserDto,
  input: CreateContractorInput,
): Promise<ContractorDto> {
  const contractor = await contractorRepository.create({ ...input, companyId: actor.companyId });
  return toContractorDto(contractor);
}

export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateContractorInput,
): Promise<ContractorDto> {
  const updated = await contractorRepository.updateInCompany(actor.companyId, id, input);
  if (!updated) throw ApiError.notFound(CONTRACTOR_NOT_FOUND);
  return toContractorDto(updated);
}

/** Refused while the contractor still has employees, so none point at a missing contractor. */
export async function remove(actor: TenantUserDto, id: string): Promise<void> {
  if (await contractorEmployeeRepository.existsForContractor(actor.companyId, id)) {
    throw ApiError.conflict('Contractor still has employees; reassign or delete them first');
  }
  const deleted = await contractorRepository.deleteInCompany(actor.companyId, id);
  if (!deleted) throw ApiError.notFound(CONTRACTOR_NOT_FOUND);
}
