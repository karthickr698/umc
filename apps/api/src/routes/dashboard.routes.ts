import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { requireRoles } from '../middlewares/require-roles.js';

/** Mounted behind `authenticate`. */
export const dashboardRouter = Router();

const routes = API_ROUTES.dashboard;
const canView = requireRoles(ROLE_ACCESS.viewDashboard);

dashboardRouter.get(routes.summary, canView, dashboardController.getDashboardSummary);
