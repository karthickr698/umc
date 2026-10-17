import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as paymentHistoryService from '../services/payment-history.service.js';
import * as paymentService from '../services/payment.service.js';
import { createAttachmentController } from './attachment.controller.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema } from '../validators/common.validator.js';
import {
  createPaymentSchema,
  listPaymentsQuerySchema,
  paymentHistoryQuerySchema,
  updatePaymentSchema,
} from '../validators/payment.validator.js';

export async function listPayments(req: Request, res: Response): Promise<void> {
  const query = listPaymentsQuerySchema.parse(req.query);
  sendSuccess(res, await paymentService.list(getAuthUser(req), query));
}

export async function listPaymentHistory(req: Request, res: Response): Promise<void> {
  const query = paymentHistoryQuerySchema.parse(req.query);
  sendSuccess(res, await paymentHistoryService.listHistory(getAuthUser(req), query));
}

export async function getPayment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await paymentService.getById(getAuthUser(req), id));
}

export async function createPayment(req: Request, res: Response): Promise<void> {
  const input = createPaymentSchema.parse(req.body);
  sendSuccess(res, await paymentService.create(getAuthUser(req), input), 201);
}

export async function updatePayment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updatePaymentSchema.parse(req.body);
  sendSuccess(res, await paymentService.update(getAuthUser(req), id, input));
}

export async function deletePayment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await paymentService.remove(getAuthUser(req), id);
  res.status(204).end();
}

export const paymentAttachments = createAttachmentController(paymentService.attachments);
