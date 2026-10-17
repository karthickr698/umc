import { USER_ROLES, isTenantUserRole, type UserRole } from './domain.js';

/** Higher rank = more privilege. Used to stop users managing accounts above their own level. */
export const ROLE_RANK: Readonly<Record<UserRole, number>> = {
  [USER_ROLES.SUPER_ADMIN]: 5,
  [USER_ROLES.OWNER]: 4,
  [USER_ROLES.ADMIN]: 3,
  [USER_ROLES.MANAGER]: 2,
  [USER_ROLES.STAFF]: 1,
};

/**
 * Which roles may perform each capability; the single source of truth for API guards and UI.
 * SUPER_ADMIN has no company, so it is deliberately absent from every company-scoped capability.
 */
export const ROLE_ACCESS = {
  viewUsers: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  manageUsers: [USER_ROLES.OWNER, USER_ROLES.ADMIN],
  viewClients: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  manageClients: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  viewSites: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  manageSites: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because employee records expose pay rates.
  viewEmployees: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  manageEmployees: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  viewContractors: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.STAFF],
  manageContractors: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because contractor employee records expose pay rates.
  viewContractorEmployees: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  manageContractorEmployees: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because assignments carry the worker's daily rate.
  viewWorkAssignments: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  manageWorkAssignments: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because payments expose what each worker is paid.
  viewPayments: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  managePayments: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because invoices expose what each worker is paid.
  viewInvoices: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  manageInvoices: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because summaries expose earnings and payments.
  viewWorkerSummaries: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because expenses expose site spending.
  viewExpenses: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  manageExpenses: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because receipts expose what each client has paid.
  viewClientPayments: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  manageClientPayments: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  // Excludes STAFF because the dashboard exposes receipts, worker pay and site spending.
  viewDashboard: [USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  /** Cross-company, read-only view of every company, its owners and its sites. */
  viewPlatform: [USER_ROLES.SUPER_ADMIN],
} as const satisfies Record<string, readonly UserRole[]>;

export type RoleAccess = keyof typeof ROLE_ACCESS;

export function hasRole(role: UserRole, allowed: readonly UserRole[]): boolean {
  return allowed.includes(role);
}

/**
 * Whether `actor` may create, edit, or assign an account with role `target`. Owners manage
 * everyone in their company; other user managers only manage roles strictly below their own.
 * Nobody can grant or manage SUPER_ADMIN through user management.
 */
export function canManageRole(actor: UserRole, target: UserRole): boolean {
  if (!hasRole(actor, ROLE_ACCESS.manageUsers) || !isTenantUserRole(target)) return false;
  return actor === USER_ROLES.OWNER || ROLE_RANK[target] < ROLE_RANK[actor];
}
