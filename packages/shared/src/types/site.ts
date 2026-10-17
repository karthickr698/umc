import type { SiteStatus } from '../constants/domain.js';
import type { Address } from './domain.js';

/**
 * The new site always belongs to the caller's company; `clientId` must be in the same company.
 * Its `code` is assigned by the server (see `SITE_CODE_FORMAT`).
 */
export interface CreateSiteRequest {
  name: string;
  clientId: string;
  address?: Address;
  status?: SiteStatus;
  /** ISO-8601 date (`2026-10-07`) or date-time. */
  startDate?: string;
}

export interface UpdateSiteRequest {
  name?: string;
  clientId?: string;
  /** Replaces the whole stored address. */
  address?: Address;
  status?: SiteStatus;
  startDate?: string;
}

export interface ListSitesQuery {
  page?: number;
  pageSize?: number;
  status?: SiteStatus;
  clientId?: string;
  /** Case-insensitive match on name or code. */
  search?: string;
}
