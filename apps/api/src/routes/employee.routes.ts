import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as employeeController from '../controllers/employee.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as employeeService from '../services/employee.service.js';

/** Mounted behind `authenticate`. */
export const employeeRouter = Router();

const canView = requireRoles(ROLE_ACCESS.viewEmployees);
const canManage = requireRoles(ROLE_ACCESS.manageEmployees);
const ownsEmployee = requireCompanyOwnership({
  param: 'id',
  resource: 'Employee',
  findCompanyId: employeeService.findCompanyId,
});

employeeRouter.get(API_ROUTES.employees.list, canView, employeeController.listEmployees);
employeeRouter.post(API_ROUTES.employees.list, canManage, employeeController.createEmployee);
employeeRouter.get(
  API_ROUTES.employees.byId,
  canView,
  ownsEmployee,
  employeeController.getEmployee,
);
employeeRouter.patch(
  API_ROUTES.employees.byId,
  canManage,
  ownsEmployee,
  employeeController.updateEmployee,
);
employeeRouter.delete(
  API_ROUTES.employees.byId,
  canManage,
  ownsEmployee,
  employeeController.deleteEmployee,
);
