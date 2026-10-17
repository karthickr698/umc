import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as expenseService from '../services/expense.service.js';
import { createAttachmentController } from './attachment.controller.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from '../validators/expense.validator.js';

export async function listExpenses(req: Request, res: Response): Promise<void> {
  const query = listExpensesQuerySchema.parse(req.query);
  sendSuccess(res, await expenseService.list(getAuthUser(req), query));
}

export async function getExpense(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await expenseService.getById(getAuthUser(req), id));
}

export async function createExpense(req: Request, res: Response): Promise<void> {
  const input = createExpenseSchema.parse(req.body);
  sendSuccess(res, await expenseService.create(getAuthUser(req), input), 201);
}

export async function updateExpense(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateExpenseSchema.parse(req.body);
  sendSuccess(res, await expenseService.update(getAuthUser(req), id, input));
}

export async function deleteExpense(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await expenseService.remove(getAuthUser(req), id);
  res.status(204).end();
}

export const expenseAttachments = createAttachmentController(expenseService.attachments);
