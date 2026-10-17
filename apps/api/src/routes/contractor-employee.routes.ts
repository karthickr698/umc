import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as contractorEmployeeController from '../controllers/contractor-employee.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as contractorEmployeeService from '../services/contractor-employee.service.js';

/** Mounted behind `authenticate`. */
export const contractorEmployeeRouter = Router();

const canView = requireRoles(ROLE_ACCESS.viewContractorEmployees);
const canManage = requireRoles(ROLE_ACCESS.manageContractorEmployees);
const ownsContractorEmployee = requireCompanyOwnership({
  param: 'id',
  resource: 'Contractor employee',
  findCompanyId: contractorEmployeeService.findCompanyId,
});

contractorEmployeeRouter.get(
  API_ROUTES.contractorEmployees.list,
  canView,
  contractorEmployeeController.listContractorEmployees,
);
contractorEmployeeRouter.post(
  API_ROUTES.contractorEmployees.list,
  canManage,
  contractorEmployeeController.createContractorEmployee,
);
contractorEmployeeRouter.get(
  API_ROUTES.contractorEmployees.byId,
  canView,
  ownsContractorEmployee,
  contractorEmployeeController.getContractorEmployee,
);
contractorEmployeeRouter.patch(
  API_ROUTES.contractorEmployees.byId,
  canManage,
  ownsContractorEmployee,
  contractorEmployeeController.updateContractorEmployee,
);
contractorEmployeeRouter.delete(
  API_ROUTES.contractorEmployees.byId,
  canManage,
  ownsContractorEmployee,
  contractorEmployeeController.deleteContractorEmployee,
);
