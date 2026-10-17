import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as paymentController from '../controllers/payment.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as paymentService from '../services/payment.service.js';
import { registerAttachmentRoutes } from './attachment.routes.js';

/** Mounted behind `authenticate`. */
export const paymentRouter = Router();

const routes = API_ROUTES.payments;
const canView = requireRoles(ROLE_ACCESS.viewPayments);
const canManage = requireRoles(ROLE_ACCESS.managePayments);
const ownsPayment = requireCompanyOwnership({
  param: 'id',
  resource: 'Payment',
  findCompanyId: paymentService.findCompanyId,
});

paymentRouter.get(routes.list, canView, paymentController.listPayments);
paymentRouter.post(routes.list, canManage, paymentController.createPayment);
// Registered before `byId` so `history` is not taken for a payment id.
paymentRouter.get(routes.history, canView, paymentController.listPaymentHistory);
paymentRouter.get(routes.byId, canView, ownsPayment, paymentController.getPayment);
paymentRouter.patch(routes.byId, canManage, ownsPayment, paymentController.updatePayment);
paymentRouter.delete(routes.byId, canManage, ownsPayment, paymentController.deletePayment);
registerAttachmentRoutes(paymentRouter, {
  routes,
  canView,
  canManage,
  owns: ownsPayment,
  controller: paymentController.paymentAttachments,
});
