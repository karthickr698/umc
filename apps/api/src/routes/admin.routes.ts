import { Router } from 'express';
import { API_ROUTES, ROLE_ACCESS } from '@umc/shared';
import * as adminController from '../controllers/admin.controller.js';
import { requireRoles } from '../middlewares/require-roles.js';

/** Mounted behind `authenticate`. Read-only and cross-company, so SUPER_ADMIN only. */
export const adminRouter = Router();

adminRouter.use(requireRoles(ROLE_ACCESS.viewPlatform));

adminRouter.get(API_ROUTES.admin.companies, adminController.listCompanies);
adminRouter.get(API_ROUTES.admin.companyById, adminController.getCompany);
adminRouter.get(API_ROUTES.admin.sites, adminController.listSites);
adminRouter.get(API_ROUTES.admin.siteById, adminController.getSite);
