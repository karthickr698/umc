import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as contractorController from '../controllers/contractor.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as contractorService from '../services/contractor.service.js';

/** Mounted behind `authenticate`. */
export const contractorRouter = Router();

const canView = requireRoles(ROLE_ACCESS.viewContractors);
const canManage = requireRoles(ROLE_ACCESS.manageContractors);
const ownsContractor = requireCompanyOwnership({
  param: 'id',
  resource: 'Contractor',
  findCompanyId: contractorService.findCompanyId,
});

contractorRouter.get(API_ROUTES.contractors.list, canView, contractorController.listContractors);
contractorRouter.post(
  API_ROUTES.contractors.list,
  canManage,
  contractorController.createContractor,
);
contractorRouter.get(
  API_ROUTES.contractors.byId,
  canView,
  ownsContractor,
  contractorController.getContractor,
);
contractorRouter.patch(
  API_ROUTES.contractors.byId,
  canManage,
  ownsContractor,
  contractorController.updateContractor,
);
contractorRouter.delete(
  API_ROUTES.contractors.byId,
  canManage,
  ownsContractor,
  contractorController.deleteContractor,
);
