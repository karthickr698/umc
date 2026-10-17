import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as expenseController from '../controllers/expense.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as expenseService from '../services/expense.service.js';
import { registerAttachmentRoutes } from './attachment.routes.js';

/** Mounted behind `authenticate`. */
export const expenseRouter = Router();

const routes = API_ROUTES.expenses;
const canView = requireRoles(ROLE_ACCESS.viewExpenses);
const canManage = requireRoles(ROLE_ACCESS.manageExpenses);
const ownsExpense = requireCompanyOwnership({
  param: 'id',
  resource: 'Expense',
  findCompanyId: expenseService.findCompanyId,
});

expenseRouter.get(routes.list, canView, expenseController.listExpenses);
expenseRouter.post(routes.list, canManage, expenseController.createExpense);
expenseRouter.get(routes.byId, canView, ownsExpense, expenseController.getExpense);
expenseRouter.patch(routes.byId, canManage, ownsExpense, expenseController.updateExpense);
expenseRouter.delete(routes.byId, canManage, ownsExpense, expenseController.deleteExpense);
registerAttachmentRoutes(expenseRouter, {
  routes,
  canView,
  canManage,
  owns: ownsExpense,
  controller: expenseController.expenseAttachments,
});
