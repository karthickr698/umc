import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as workAssignmentController from '../controllers/work-assignment.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as workAssignmentService from '../services/work-assignment.service.js';
import { registerAttachmentRoutes } from './attachment.routes.js';

/** Mounted behind `authenticate`. */
export const workAssignmentRouter = Router();

const routes = API_ROUTES.workAssignments;
const canView = requireRoles(ROLE_ACCESS.viewWorkAssignments);
const canManage = requireRoles(ROLE_ACCESS.manageWorkAssignments);
const ownsWorkAssignment = requireCompanyOwnership({
  param: 'id',
  resource: 'Work assignment',
  findCompanyId: workAssignmentService.findCompanyId,
});

workAssignmentRouter.get(routes.list, canView, workAssignmentController.listWorkAssignments);
workAssignmentRouter.post(routes.list, canManage, workAssignmentController.createWorkAssignment);
workAssignmentRouter.post(
  routes.bulk,
  canManage,
  workAssignmentController.bulkCreateWorkAssignments,
);
workAssignmentRouter.get(routes.daily, canView, workAssignmentController.listDailyWorkAssignments);
workAssignmentRouter.get(routes.bySite, canView, workAssignmentController.listSiteWorkAssignments);
workAssignmentRouter.get(
  routes.byWorker,
  canView,
  workAssignmentController.listWorkerWorkAssignments,
);
workAssignmentRouter.get(
  routes.byId,
  canView,
  ownsWorkAssignment,
  workAssignmentController.getWorkAssignment,
);
workAssignmentRouter.patch(
  routes.byId,
  canManage,
  ownsWorkAssignment,
  workAssignmentController.updateWorkAssignment,
);
workAssignmentRouter.delete(
  routes.byId,
  canManage,
  ownsWorkAssignment,
  workAssignmentController.deleteWorkAssignment,
);
registerAttachmentRoutes(workAssignmentRouter, {
  routes,
  canView,
  canManage,
  owns: ownsWorkAssignment,
  controller: workAssignmentController.workAssignmentAttachments,
});
