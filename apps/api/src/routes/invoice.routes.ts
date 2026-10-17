import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as invoiceController from '../controllers/invoice.controller.js';
import { expensiveOperationRateLimit } from '../middlewares/rate-limit.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as invoiceService from '../services/invoice.service.js';

/** Mounted behind `authenticate`. */
export const invoiceRouter = Router();

const routes = API_ROUTES.invoices;
const canView = requireRoles(ROLE_ACCESS.viewInvoices);
const canManage = requireRoles(ROLE_ACCESS.manageInvoices);
const ownsInvoice = requireCompanyOwnership({
  param: 'id',
  resource: 'Invoice',
  findCompanyId: invoiceService.findCompanyId,
});

invoiceRouter.get(routes.list, canView, invoiceController.listInvoices);
invoiceRouter.post(
  routes.list,
  canManage,
  expensiveOperationRateLimit,
  invoiceController.createInvoice,
);
invoiceRouter.get(routes.byId, canView, ownsInvoice, invoiceController.getInvoice);
invoiceRouter.get(routes.view, canView, ownsInvoice, invoiceController.viewInvoicePdf);
invoiceRouter.get(routes.download, canView, ownsInvoice, invoiceController.downloadInvoicePdf);
invoiceRouter.post(
  routes.regenerate,
  canManage,
  ownsInvoice,
  expensiveOperationRateLimit,
  invoiceController.regenerateInvoice,
);
invoiceRouter.post(
  routes.sendWhatsapp,
  canManage,
  ownsInvoice,
  expensiveOperationRateLimit,
  invoiceController.sendInvoiceWhatsapp,
);
