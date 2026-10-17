import { Router } from 'express';
import { API_ROUTES } from '@umc/shared';
import { authenticate } from '../middlewares/authenticate.js';
import { noStore } from '../middlewares/no-store.js';
import { apiRateLimit } from '../middlewares/rate-limit.js';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { clientPaymentRouter } from './client-payment.routes.js';
import { clientRouter } from './client.routes.js';
import { contractorEmployeeRouter } from './contractor-employee.routes.js';
import { contractorRouter } from './contractor.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { employeeRouter } from './employee.routes.js';
import { expenseRouter } from './expense.routes.js';
import { healthRouter } from './health.routes.js';
import { invoiceRouter } from './invoice.routes.js';
import { paymentRouter } from './payment.routes.js';
import { siteReportRouter } from './site-report.routes.js';
import { siteRouter } from './site.routes.js';
import { userRouter } from './user.routes.js';
import { webhookRouter } from './webhook.routes.js';
import { workAssignmentRouter } from './work-assignment.routes.js';
import { workerReportRouter } from './worker-report.routes.js';
import { workerSummaryRouter } from './worker-summary.routes.js';

export const apiRouter = Router();

apiRouter.use(noStore);

// Public routes. Webhooks are signed and may arrive in bursts, so they skip the rate limit.
apiRouter.use(API_ROUTES.webhooks.base, webhookRouter);
apiRouter.use(apiRateLimit);
apiRouter.use(healthRouter);
apiRouter.use(API_ROUTES.auth.base, authRouter);

// Business routers must each be mounted under their own prefix behind `authenticate`
// (e.g. `apiRouter.use(API_ROUTES.projects, authenticate, projectRouter)`), so unknown
// paths still reach the 404 handler instead of answering 401.
apiRouter.use(API_ROUTES.users.base, authenticate, userRouter);
apiRouter.use(API_ROUTES.clients.base, authenticate, clientRouter);
apiRouter.use(API_ROUTES.sites.base, authenticate, siteRouter);
apiRouter.use(API_ROUTES.employees.base, authenticate, employeeRouter);
apiRouter.use(API_ROUTES.contractors.base, authenticate, contractorRouter);
apiRouter.use(API_ROUTES.contractorEmployees.base, authenticate, contractorEmployeeRouter);
apiRouter.use(API_ROUTES.workAssignments.base, authenticate, workAssignmentRouter);
apiRouter.use(API_ROUTES.payments.base, authenticate, paymentRouter);
apiRouter.use(API_ROUTES.invoices.base, authenticate, invoiceRouter);
apiRouter.use(API_ROUTES.workerSummaries.base, authenticate, workerSummaryRouter);
apiRouter.use(API_ROUTES.expenses.base, authenticate, expenseRouter);
apiRouter.use(API_ROUTES.clientPayments.base, authenticate, clientPaymentRouter);
apiRouter.use(API_ROUTES.dashboard.base, authenticate, dashboardRouter);
apiRouter.use(API_ROUTES.reports.base, authenticate, workerReportRouter, siteReportRouter);
apiRouter.use(API_ROUTES.admin.base, authenticate, adminRouter);
