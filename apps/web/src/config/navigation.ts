import {
  BanknoteArrowUp,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChartColumn,
  ChartPie,
  Construction,
  HandCoins,
  Handshake,
  HardHat,
  LayoutDashboard,
  type LucideIcon,
  MapPinned,
  Receipt,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import {
  hasRole,
  isTenantUserRole,
  ROLE_ACCESS,
  type RoleAccess,
  type UserRole,
} from '@umc/shared';
import { APP_ROUTES, type AppRouteKey } from './routes';

export interface NavItem {
  id: AppRouteKey;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  /**
   * Who sees the item: a capability, `'everyone'`, or (when omitted) every company user. Company
   * pages are hidden from SUPER_ADMIN, who has no company.
   */
  access?: RoleAccess | 'everyone';
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        description: 'Company-wide snapshot of sites, workforce and money.',
        path: APP_ROUTES.dashboard,
        icon: LayoutDashboard,
        access: 'everyone',
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform',
    items: [
      {
        id: 'adminCompanies',
        label: 'Companies',
        description: 'Every company on the platform with its owners.',
        path: APP_ROUTES.adminCompanies,
        icon: Building2,
        access: 'viewPlatform',
      },
      {
        id: 'adminSites',
        label: 'All sites',
        description: 'Construction sites across every company.',
        path: APP_ROUTES.adminSites,
        icon: MapPinned,
        access: 'viewPlatform',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        id: 'clients',
        label: 'Clients',
        description: 'Step 1: the people or companies you build for.',
        path: APP_ROUTES.clients,
        icon: Handshake,
        access: 'viewClients',
      },
      {
        id: 'sites',
        label: 'Sites',
        description: 'Step 2: each building or project you work on.',
        path: APP_ROUTES.sites,
        icon: Construction,
        access: 'viewSites',
      },
      {
        id: 'employees',
        label: 'Employees',
        description: 'Step 3: your own workers and their daily wage.',
        path: APP_ROUTES.employees,
        icon: Users,
        access: 'viewEmployees',
      },
      {
        id: 'contractors',
        label: 'Contractors',
        description: 'Step 3: contractors and the workers they bring.',
        path: APP_ROUTES.contractors,
        icon: HardHat,
        access: 'viewContractors',
      },
      {
        id: 'workAllocation',
        label: 'Assign Work',
        description: 'Step 4: choose who works at which site each day.',
        path: APP_ROUTES.workAllocation,
        icon: CalendarCheck,
        access: 'viewWorkAssignments',
      },
      {
        id: 'workSchedule',
        label: 'Work Schedule',
        description: 'Calendar and list of who works where, and who is free.',
        path: APP_ROUTES.workSchedule,
        icon: CalendarDays,
        access: 'viewWorkAssignments',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      {
        id: 'paymentEntry',
        label: 'Pay Workers',
        description: 'Step 5: pay a worker or contractor in a few taps.',
        path: APP_ROUTES.paymentEntry,
        icon: BanknoteArrowUp,
        access: 'managePayments',
      },
      {
        id: 'payments',
        label: 'Payment History',
        description: 'Wages and advances paid to workers.',
        path: APP_ROUTES.payments,
        icon: Wallet,
        access: 'viewPayments',
      },
      {
        id: 'expenses',
        label: 'Site Expenses',
        description: 'Money spent on a site: materials, transport, tools.',
        path: APP_ROUTES.expenses,
        icon: Receipt,
        access: 'viewExpenses',
      },
      {
        id: 'clientPayments',
        label: 'Money Received',
        description: 'Payments your clients have given you.',
        path: APP_ROUTES.clientPayments,
        icon: HandCoins,
        access: 'viewClientPayments',
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      {
        id: 'reports',
        label: 'Worker Report',
        description: 'Worker work days, earnings, payments and outstanding dues.',
        path: APP_ROUTES.reports,
        icon: ChartColumn,
        access: 'viewWorkerSummaries',
      },
      {
        id: 'siteReport',
        label: 'Site Report',
        description: 'Client receipts, payments, expenses and balance per site.',
        path: APP_ROUTES.siteReport,
        icon: ChartPie,
        access: 'viewDashboard',
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        description: 'Company profile, users and preferences.',
        path: APP_ROUTES.settings,
        icon: Settings,
      },
    ],
  },
];

export const NAV_ITEMS: readonly NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

export function findNavItemByPath(path: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.path === path);
}

/**
 * The dashboard, and any item whose path is the parent of another item's (e.g. `/payments` vs
 * `/payments/new`), is only active on its exact path so a single item is highlighted.
 */
export function matchesNavPathExactly(path: string): boolean {
  return (
    path === APP_ROUTES.dashboard || NAV_ITEMS.some((item) => item.path.startsWith(`${path}/`))
  );
}

export function canSeeNavItem(role: UserRole, { access }: Pick<NavItem, 'access'>): boolean {
  if (access === 'everyone') return true;
  if (access === undefined) return isTenantUserRole(role);
  return hasRole(role, ROLE_ACCESS[access]);
}

/** Sections filtered to what `role` may see; without a role every item is shown. */
export function getVisibleNavSections(role: UserRole | undefined): NavSection[] {
  if (!role) return [...NAV_SECTIONS];
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSeeNavItem(role, item)),
  })).filter((section) => section.items.length > 0);
}
