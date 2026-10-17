import type { Request, Response } from 'express';
import * as adminService from '../services/admin.service.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  adminListCompaniesQuerySchema,
  adminListSitesQuerySchema,
} from '../validators/admin.validator.js';
import { idParamsSchema } from '../validators/common.validator.js';

export async function listCompanies(req: Request, res: Response): Promise<void> {
  const query = adminListCompaniesQuerySchema.parse(req.query);
  sendSuccess(res, await adminService.listCompanies(query));
}

export async function getCompany(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await adminService.getCompany(id));
}

export async function listSites(req: Request, res: Response): Promise<void> {
  const query = adminListSitesQuerySchema.parse(req.query);
  sendSuccess(res, await adminService.listSites(query));
}

export async function getSite(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await adminService.getSite(id));
}
