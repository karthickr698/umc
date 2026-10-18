import { createBrowserRouter, type RouteObject } from 'react-router';
import { RootErrorBoundary, RouteErrorBoundary } from '@/components/errors/route-error-boundary';
import { FullScreenPageLoader, PageLoader } from '@/components/feedback/page-loader';
import { AppLayout } from '@/components/layout/app-layout';
import { NAV_ITEMS } from '@/config/navigation';
import { APP_ROUTES } from '@/config/routes';
import { GuestOnly, RequireAccess, RequireAuth } from '@/features/auth';
import type { RouteHandle } from '@/lib/route-handle';

/** Nav items with a real page; every other item gets the "coming soon" placeholder. */
const IMPLEMENTED_PATHS = new Set<string>([
  APP_ROUTES.dashboard,
  APP_ROUTES.sites,
  APP_ROUTES.clients,
  APP_ROUTES.employees,
  APP_ROUTES.contractors,
  APP_ROUTES.workAllocation,
  APP_ROUTES.workSchedule,
  APP_ROUTES.payments,
  APP_ROUTES.paymentEntry,
  APP_ROUTES.expenses,
  APP_ROUTES.clientPayments,
  APP_ROUTES.reports,
  APP_ROUTES.siteReport,
  APP_ROUTES.adminCompanies,
  APP_ROUTES.adminSites,
]);

const recordRoutes: RouteObject[] = [
  {
    element: <RequireAccess access="viewSites" />,
    children: [
      {
        path: APP_ROUTES.sites,
        handle: { breadcrumb: 'Sites' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/sites/sites-page')).SitesPage,
        }),
      },
    ],
  },
  {
    element: <RequireAccess access="viewClients" />,
    children: [
      {
        path: APP_ROUTES.clients,
        handle: { breadcrumb: 'Clients' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/clients/clients-page')).ClientsPage,
        }),
      },
    ],
  },
  {
    element: <RequireAccess access="viewEmployees" />,
    children: [
      {
        path: APP_ROUTES.employees,
        handle: { breadcrumb: 'Employees' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/employees/employees-page')).EmployeesPage,
        }),
      },
    ],
  },
  {
    element: <RequireAccess access="viewContractors" />,
    children: [
      {
        path: APP_ROUTES.contractors,
        handle: { breadcrumb: 'Contractors' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/contractors/contractors-page')).ContractorsPage,
        }),
      },
    ],
  },
];

const workAllocationRoutes: RouteObject = {
  element: <RequireAccess access="viewWorkAssignments" />,
  children: [
    {
      path: APP_ROUTES.workAllocation,
      handle: { breadcrumb: 'Assign Work' } satisfies RouteHandle,
      lazy: async () => ({
        Component: (await import('@/features/work-allocation/work-allocation-page'))
          .WorkAllocationPage,
      }),
    },
    {
      path: APP_ROUTES.workSchedule,
      handle: { breadcrumb: 'Work Schedule' } satisfies RouteHandle,
      lazy: async () => ({
        Component: (await import('@/features/work-allocation/work-schedule-page')).WorkSchedulePage,
      }),
    },
  ],
};

const paymentRoutes: RouteObject[] = [
  {
    element: <RequireAccess access="viewPayments" />,
    children: [
      {
        path: APP_ROUTES.payments,
        handle: { breadcrumb: 'Payment History' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/payments/payment-history-page')).PaymentHistoryPage,
        }),
      },
    ],
  },
  {
    element: <RequireAccess access="managePayments" />,
    children: [
      {
        path: APP_ROUTES.paymentEntry,
        handle: { breadcrumb: 'Pay Workers' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/payments/payment-entry-page')).PaymentEntryPage,
        }),
      },
    ],
  },
  {
    element: <RequireAccess access="viewExpenses" />,
    children: [
      {
        path: APP_ROUTES.expenses,
        handle: { breadcrumb: 'Site Expenses' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/expenses/expenses-page')).ExpensesPage,
        }),
      },
    ],
  },
  {
    element: <RequireAccess access="viewClientPayments" />,
    children: [
      {
        path: APP_ROUTES.clientPayments,
        handle: { breadcrumb: 'Money Received' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/client-payments/client-payments-page'))
            .ClientPaymentsPage,
        }),
      },
    ],
  },
];

const reportRoutes: RouteObject[] = [
  {
    element: <RequireAccess access="viewWorkerSummaries" />,
    children: [
      {
        path: APP_ROUTES.reports,
        handle: { breadcrumb: 'Worker Report' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/reports/worker-financial-report-page'))
            .WorkerFinancialReportPage,
        }),
      },
    ],
  },
  {
    element: <RequireAccess access="viewDashboard" />,
    children: [
      {
        path: APP_ROUTES.siteReport,
        handle: { breadcrumb: 'Site Report' } satisfies RouteHandle,
        lazy: async () => ({
          Component: (await import('@/features/reports/site-financial-report-page'))
            .SiteFinancialReportPage,
        }),
      },
    ],
  },
];

const moduleRoutes: RouteObject[] = NAV_ITEMS.filter(
  (item) => !IMPLEMENTED_PATHS.has(item.path),
).map((item) => ({
  path: item.path,
  handle: { breadcrumb: item.label } satisfies RouteHandle,
  lazy: async () => ({
    Component: (await import('@/components/pages/coming-soon-page')).ComingSoonPage,
  }),
}));

const platformRoutes: RouteObject = {
  element: <RequireAccess access="viewPlatform" />,
  children: [
    {
      path: APP_ROUTES.adminCompanies,
      handle: { breadcrumb: 'Companies' } satisfies RouteHandle,
      lazy: async () => ({
        Component: (await import('@/features/admin/companies-page')).CompaniesPage,
      }),
    },
    {
      path: APP_ROUTES.adminCompanyDetail,
      handle: { breadcrumb: 'Company' } satisfies RouteHandle,
      lazy: async () => ({
        Component: (await import('@/features/admin/company-detail-page')).CompanyDetailPage,
      }),
    },
    {
      path: APP_ROUTES.adminSites,
      handle: { breadcrumb: 'All sites' } satisfies RouteHandle,
      lazy: async () => ({
        Component: (await import('@/features/admin/sites-page')).SitesPage,
      }),
    },
    {
      path: APP_ROUTES.adminSiteDetail,
      handle: { breadcrumb: 'Site' } satisfies RouteHandle,
      lazy: async () => ({
        Component: (await import('@/features/admin/site-detail-page')).SiteDetailPage,
      }),
    },
  ],
};

export const router = createBrowserRouter([
  {
    ErrorBoundary: RootErrorBoundary,
    children: [
      {
        Component: GuestOnly,
        HydrateFallback: FullScreenPageLoader,
        children: [
          {
            path: APP_ROUTES.login,
            lazy: async () => ({
              Component: (await import('@/features/auth/login-page')).LoginPage,
            }),
          },
          {
            path: APP_ROUTES.register,
            lazy: async () => ({
              Component: (await import('@/features/auth/register-page')).RegisterPage,
            }),
          },
        ],
      },
      {
        Component: RequireAuth,
        children: [
          {
            path: APP_ROUTES.dashboard,
            Component: AppLayout,
            children: [
              {
                // Pathless wrapper so page errors and initial loads render inside the shell.
                ErrorBoundary: RouteErrorBoundary,
                HydrateFallback: PageLoader,
                children: [
                  {
                    index: true,
                    handle: { breadcrumb: 'Dashboard' } satisfies RouteHandle,
                    lazy: async () => ({
                      Component: (await import('@/features/dashboard/dashboard-page'))
                        .DashboardPage,
                    }),
                  },
                  ...moduleRoutes,
                  ...recordRoutes,
                  workAllocationRoutes,
                  ...paymentRoutes,
                  ...reportRoutes,
                  platformRoutes,
                  {
                    path: '*',
                    handle: { breadcrumb: 'Not found' } satisfies RouteHandle,
                    lazy: async () => ({
                      Component: (await import('@/components/pages/not-found-page')).NotFoundPage,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
