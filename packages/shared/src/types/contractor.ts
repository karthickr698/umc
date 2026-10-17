import type { ContractorCategory, ContractorStatus } from '../constants/domain.js';
import type { Address } from './domain.js';

/** The new contractor always belongs to the caller's company. */
export interface CreateContractorRequest {
  name: string;
  phone?: string;
  email?: string;
  category: ContractorCategory;
  address?: Address;
  status?: ContractorStatus;
  notes?: string;
}

export interface UpdateContractorRequest {
  name?: string;
  phone?: string;
  email?: string;
  category?: ContractorCategory;
  /** Replaces the whole stored address. */
  address?: Address;
  status?: ContractorStatus;
  notes?: string;
}

export interface ListContractorsQuery {
  page?: number;
  pageSize?: number;
  status?: ContractorStatus;
  category?: ContractorCategory;
  /** Case-insensitive match on name, email or phone. */
  search?: string;
}
