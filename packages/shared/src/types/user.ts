import type { TenantUserRole, UserStatus } from '../constants/domain.js';

/** The new user always joins the caller's company. */
export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: TenantUserRole;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  role?: TenantUserRole;
  status?: UserStatus;
}

export interface ListUsersQuery {
  page?: number;
  pageSize?: number;
  role?: TenantUserRole;
  status?: UserStatus;
}
