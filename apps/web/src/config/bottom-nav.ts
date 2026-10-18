import { House, type LucideIcon, Plus, ReceiptText, Wallet } from 'lucide-react';
import type { UserRole } from '@umc/shared';
import { canSeeNavItem, type NavItem } from './navigation';
import { APP_ROUTES, createRecordPath } from './routes';

export interface BottomNavItem {
  id: string;
  label: string;
  /** Full name for screen readers when `label` is abbreviated. */
  description: string;
  /** Where the tab links to; may carry a query, e.g. to open an "add" form. */
  to: string;
  /** The page the tab stands for; the tab is active while it is shown. */
  activePath: string;
  icon: LucideIcon;
  access: NonNullable<NavItem['access']>;
  /** The raised action in the middle of the bar. */
  primary?: boolean;
}

/** Quick access on phones and tablets; "More" (the full menu) is added after these. */
export const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Dashboard',
    to: APP_ROUTES.dashboard,
    activePath: APP_ROUTES.dashboard,
    icon: House,
    access: 'everyone',
  },
  {
    id: 'payments',
    label: 'Payments',
    description: 'Payment history',
    to: APP_ROUTES.payments,
    activePath: APP_ROUTES.payments,
    icon: Wallet,
    access: 'viewPayments',
  },
  {
    id: 'pay',
    label: 'Pay',
    description: 'Add a payment',
    to: APP_ROUTES.paymentEntry,
    activePath: APP_ROUTES.paymentEntry,
    icon: Plus,
    access: 'managePayments',
    primary: true,
  },
  {
    id: 'expense',
    label: 'Expense',
    description: 'Add an expense',
    to: createRecordPath(APP_ROUTES.expenses),
    activePath: APP_ROUTES.expenses,
    icon: ReceiptText,
    access: 'manageExpenses',
  },
];

export function getVisibleBottomNavItems(role: UserRole | undefined): BottomNavItem[] {
  return role ? BOTTOM_NAV_ITEMS.filter((item) => canSeeNavItem(role, item)) : [];
}
