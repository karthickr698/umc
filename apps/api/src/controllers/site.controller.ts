import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as siteService from '../services/site.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createSiteSchema,
  listSitesQuerySchema,
  updateSiteSchema,
} from '../validators/site.validator.js';

export async function listSites(req: Request, res: Response): Promise<void> {
  const query = listSitesQuerySchema.parse(req.query);
  sendSuccess(res, await siteService.list(getAuthUser(req), query));
}

export async function getSite(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await siteService.getById(getAuthUser(req), id));
}

export async function createSite(req: Request, res: Response): Promise<void> {
  const input = createSiteSchema.parse(req.body);
  sendSuccess(res, await siteService.create(getAuthUser(req), input), 201);
}

export async function updateSite(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateSiteSchema.parse(req.body);
  sendSuccess(res, await siteService.update(getAuthUser(req), id, input));
}

export async function deleteSite(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await siteService.remove(getAuthUser(req), id);
  res.status(204).end();
}
