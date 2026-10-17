import type { CompanyStatus, SiteStatus } from '../constants/domain.js';
import type { DashboardTotals } from './dashboard.js';
import type { ClientDto, CompanyDto, SiteDto, UserDto } from './domain.js';

/** `GET /admin/companies` filters (SUPER_ADMIN only). */
export interface AdminListCompaniesQuery {
  page?: number;
  pageSize?: number;
  status?: CompanyStatus;
  /** Case-insensitive match on the company name. */
  search?: string;
}

export interface AdminCompanySummaryDto extends CompanyDto {
  owners: UserDto[];
  userCount: number;
  siteCount: number;
}

/** `GET /admin/companies/:id`; list its sites with `GET /admin/sites?companyId=`. */
export interface AdminCompanyDetailDto extends AdminCompanySummaryDto {
  users: UserDto[];
}

/** `GET /admin/sites` filters (SUPER_ADMIN only). */
export interface AdminListSitesQuery {
  page?: number;
  pageSize?: number;
  companyId?: string;
  status?: SiteStatus;
  /** Case-insensitive match on site name or code. */
  search?: string;
}

export interface AdminSiteDto extends SiteDto {
  companyName: string;
  clientName: string;
}

/** `GET /admin/sites/:id`: the site with its company, owners, client and money totals. */
export interface AdminSiteDetailDto {
  site: SiteDto;
  company: CompanyDto;
  owners: UserDto[];
  client: ClientDto;
  totals: DashboardTotals;
}
