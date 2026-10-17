import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as siteReportController from '../controllers/site-report.controller.js';
import { expensiveOperationRateLimit } from '../middlewares/rate-limit.js';
import { requireRoles } from '../middlewares/require-roles.js';

/** Mounted behind `authenticate`. */
export const siteReportRouter = Router();

const routes = API_ROUTES.reports;
// The report exposes the same receipts, worker pay and site spending as the dashboard.
const canView = requireRoles(ROLE_ACCESS.viewDashboard);

siteReportRouter.get(routes.siteFinancial, canView, siteReportController.getSiteFinancialReport);
siteReportRouter.get(
  routes.siteFinancialExport,
  canView,
  expensiveOperationRateLimit,
  siteReportController.exportSiteFinancialReport,
);
