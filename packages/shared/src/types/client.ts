import type { ClientStatus } from '../constants/domain.js';
import type { Address } from './domain.js';

/** The new client always belongs to the caller's company. */
export interface CreateClientRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
  status?: ClientStatus;
}

export interface UpdateClientRequest {
  name?: string;
  phone?: string;
  email?: string;
  /** Replaces the whole stored address. */
  address?: Address;
  status?: ClientStatus;
}

export interface ListClientsQuery {
  page?: number;
  pageSize?: number;
  status?: ClientStatus;
  /** Case-insensitive match on name, email or phone. */
  search?: string;
}
