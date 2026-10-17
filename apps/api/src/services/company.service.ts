import type { CompanyDto } from '@umc/shared';
import type { CompanyRecord } from '../repositories/company.repository.js';

export function toCompanyDto(company: CompanyRecord): CompanyDto {
  return {
    id: company._id.toString(),
    name: company.name,
    ...(company.phone !== undefined && { phone: company.phone }),
    ...(company.email !== undefined && { email: company.email }),
    ...(company.address !== undefined && { address: company.address }),
    status: company.status,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}
