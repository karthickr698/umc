import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as clientService from '../services/client.service.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  createClientSchema,
  listClientsQuerySchema,
  updateClientSchema,
} from '../validators/client.validator.js';
import { idParamsSchema } from '../validators/common.validator.js';

export async function listClients(req: Request, res: Response): Promise<void> {
  const query = listClientsQuerySchema.parse(req.query);
  sendSuccess(res, await clientService.list(getAuthUser(req), query));
}

export async function getClient(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await clientService.getById(getAuthUser(req), id));
}

export async function createClient(req: Request, res: Response): Promise<void> {
  const input = createClientSchema.parse(req.body);
  sendSuccess(res, await clientService.create(getAuthUser(req), input), 201);
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateClientSchema.parse(req.body);
  sendSuccess(res, await clientService.update(getAuthUser(req), id, input));
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await clientService.remove(getAuthUser(req), id);
  res.status(204).end();
}
