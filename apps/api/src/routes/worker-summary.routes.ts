import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as workerSummaryController from '../controllers/worker-summary.controller.js';
import { requireRoles } from '../middlewares/require-roles.js';

/** Mounted behind `authenticate`. */
export const workerSummaryRouter = Router();

const routes = API_ROUTES.workerSummaries;
const canView = requireRoles(ROLE_ACCESS.viewWorkerSummaries);

workerSummaryRouter.get(routes.list, canView, workerSummaryController.listWorkerSummaries);
workerSummaryRouter.get(routes.byWorker, canView, workerSummaryController.getWorkerSummary);
