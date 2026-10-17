import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as workerReportController from '../controllers/worker-report.controller.js';
import { expensiveOperationRateLimit } from '../middlewares/rate-limit.js';
import { requireRoles } from '../middlewares/require-roles.js';

/** Mounted behind `authenticate`. */
export const workerReportRouter = Router();

const routes = API_ROUTES.reports;
// The report exposes the same earnings and payments as the worker summaries.
const canView = requireRoles(ROLE_ACCESS.viewWorkerSummaries);

workerReportRouter.get(
  routes.workerFinancial,
  canView,
  workerReportController.getWorkerFinancialReport,
);
workerReportRouter.get(
  routes.workerFinancialExport,
  canView,
  expensiveOperationRateLimit,
  workerReportController.exportWorkerFinancialReport,
);
