import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as contractorService from '../services/contractor.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createContractorSchema,
  listContractorsQuerySchema,
  updateContractorSchema,
} from '../validators/contractor.validator.js';

export async function listContractors(req: Request, res: Response): Promise<void> {
  const query = listContractorsQuerySchema.parse(req.query);
  sendSuccess(res, await contractorService.list(getAuthUser(req), query));
}

export async function getContractor(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await contractorService.getById(getAuthUser(req), id));
}

export async function createContractor(req: Request, res: Response): Promise<void> {
  const input = createContractorSchema.parse(req.body);
  sendSuccess(res, await contractorService.create(getAuthUser(req), input), 201);
}

export async function updateContractor(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateContractorSchema.parse(req.body);
  sendSuccess(res, await contractorService.update(getAuthUser(req), id, input));
}

export async function deleteContractor(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await contractorService.remove(getAuthUser(req), id);
  res.status(204).end();
}
