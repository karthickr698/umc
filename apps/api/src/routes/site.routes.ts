import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as siteController from '../controllers/site.controller.js';
import { requireCompanyOwnership } from '../middlewares/require-company-ownership.js';
import { requireRoles } from '../middlewares/require-roles.js';
import * as siteService from '../services/site.service.js';

/** Mounted behind `authenticate`. */
export const siteRouter = Router();

const canView = requireRoles(ROLE_ACCESS.viewSites);
const canManage = requireRoles(ROLE_ACCESS.manageSites);
const ownsSite = requireCompanyOwnership({
  param: 'id',
  resource: 'Site',
  findCompanyId: siteService.findCompanyId,
});

siteRouter.get(API_ROUTES.sites.list, canView, siteController.listSites);
siteRouter.post(API_ROUTES.sites.list, canManage, siteController.createSite);
siteRouter.get(API_ROUTES.sites.byId, canView, ownsSite, siteController.getSite);
siteRouter.patch(API_ROUTES.sites.byId, canManage, ownsSite, siteController.updateSite);
siteRouter.delete(API_ROUTES.sites.byId, canManage, ownsSite, siteController.deleteSite);
