import { API_ROUTES } from '@umc/shared';
import type { AppRouteKey } from '@/config/routes';
import { withQuery } from '@/utils/query-string';

export interface SetupStep {
  /** Nav item the step links to; the step is hidden from users who can't see that page. */
  page: AppRouteKey;
  title: string;
  hint: string;
  action: string;
  /** Lists checked for records; the step is done once any of them has one. */
  lists: readonly string[];
}

const firstRecord = (base: string) => withQuery(base, { pageSize: 1 });

/** The order a new company sets things up in, from clients to money coming in. */
export const SETUP_STEPS: readonly SetupStep[] = [
  {
    page: 'clients',
    title: 'Add a client',
    hint: 'The person or company you are building for.',
    action: 'Add client',
    lists: [firstRecord(API_ROUTES.clients.base)],
  },
  {
    page: 'sites',
    title: 'Add a site',
    hint: 'The building or project you are working on for that client.',
    action: 'Add site',
    lists: [firstRecord(API_ROUTES.sites.base)],
  },
  {
    page: 'employees',
    title: 'Add your workers',
    hint: 'Your own workers with their daily wage. Contractors can be added too.',
    action: 'Add workers',
    lists: [firstRecord(API_ROUTES.employees.base), firstRecord(API_ROUTES.contractors.base)],
  },
  {
    page: 'workAllocation',
    title: 'Assign work',
    hint: 'Choose who works at which site each day.',
    action: 'Assign work',
    lists: [firstRecord(API_ROUTES.workAssignments.base)],
  },
  {
    page: 'paymentEntry',
    title: 'Pay your workers',
    hint: 'Record wages and advances as you pay them.',
    action: 'Pay workers',
    lists: [firstRecord(API_ROUTES.payments.base)],
  },
  {
    page: 'expenses',
    title: 'Record site expenses',
    hint: 'Cement, sand, transport, tools: anything you spend on a site.',
    action: 'Add expense',
    lists: [firstRecord(API_ROUTES.expenses.base)],
  },
  {
    page: 'clientPayments',
    title: 'Record money received',
    hint: 'Each time a client pays you, so you know what is still due.',
    action: 'Add money received',
    lists: [firstRecord(API_ROUTES.clientPayments.base)],
  },
];
