import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as clientPaymentController from '../controllers/client-payment.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as clientPaymentService from '../services/client-payment.service.js';
import { registerAttachmentRoutes } from './attachment.routes.js';

/** Mounted behind `authenticate`. */
export const clientPaymentRouter = Router();

const routes = API_ROUTES.clientPayments;
const canView = requireRoles(ROLE_ACCESS.viewClientPayments);
const canManage = requireRoles(ROLE_ACCESS.manageClientPayments);
const ownsClientPayment = requireCompanyOwnership({
  param: 'id',
  resource: 'Client payment',
  findCompanyId: clientPaymentService.findCompanyId,
});

clientPaymentRouter.get(routes.list, canView, clientPaymentController.listClientPayments);
clientPaymentRouter.post(routes.list, canManage, clientPaymentController.createClientPayment);
// Registered before `byId` so `/summary` is not taken for an id.
clientPaymentRouter.get(routes.summary, canView, clientPaymentController.getClientPaymentSummary);
clientPaymentRouter.get(
  routes.byId,
  canView,
  ownsClientPayment,
  clientPaymentController.getClientPayment,
);
clientPaymentRouter.patch(
  routes.byId,
  canManage,
  ownsClientPayment,
  clientPaymentController.updateClientPayment,
);
clientPaymentRouter.delete(
  routes.byId,
  canManage,
  ownsClientPayment,
  clientPaymentController.deleteClientPayment,
);
registerAttachmentRoutes(clientPaymentRouter, {
  routes,
  canView,
  canManage,
  owns: ownsClientPayment,
  controller: clientPaymentController.clientPaymentAttachments,
});
