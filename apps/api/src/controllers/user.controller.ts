import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as userService from '../services/user.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from '../validators/user.validator.js';

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = listUsersQuerySchema.parse(req.query);
  sendSuccess(res, await userService.list(getAuthUser(req), query));
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await userService.getById(getAuthUser(req), id));
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const input = createUserSchema.parse(req.body);
  sendSuccess(res, await userService.create(getAuthUser(req), input), 201);
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateUserSchema.parse(req.body);
  sendSuccess(res, await userService.update(getAuthUser(req), id, input));
}
