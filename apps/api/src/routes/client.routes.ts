import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as clientController from '../controllers/client.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as clientService from '../services/client.service.js';

/** Mounted behind `authenticate`. */
export const clientRouter = Router();

const canView = requireRoles(ROLE_ACCESS.viewClients);
const canManage = requireRoles(ROLE_ACCESS.manageClients);
const ownsClient = requireCompanyOwnership({
  param: 'id',
  resource: 'Client',
  findCompanyId: clientService.findCompanyId,
});

clientRouter.get(API_ROUTES.clients.list, canView, clientController.listClients);
clientRouter.post(API_ROUTES.clients.list, canManage, clientController.createClient);
clientRouter.get(API_ROUTES.clients.byId, canView, ownsClient, clientController.getClient);
clientRouter.patch(API_ROUTES.clients.byId, canManage, ownsClient, clientController.updateClient);
clientRouter.delete(API_ROUTES.clients.byId, canManage, ownsClient, clientController.deleteClient);
