import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as clientPaymentSummaryService from '../services/client-payment-summary.service.js';
import * as clientPaymentService from '../services/client-payment.service.js';
import { createAttachmentController } from './attachment.controller.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  clientPaymentSummaryQuerySchema,
  createClientPaymentSchema,
  listClientPaymentsQuerySchema,
  updateClientPaymentSchema,
} from '../validators/client-payment.validator.js';
import { idParamsSchema } from '../validators/common.validator.js';

export async function listClientPayments(req: Request, res: Response): Promise<void> {
  const query = listClientPaymentsQuerySchema.parse(req.query);
  sendSuccess(res, await clientPaymentService.list(getAuthUser(req), query));
}

export async function getClientPaymentSummary(req: Request, res: Response): Promise<void> {
  const query = clientPaymentSummaryQuerySchema.parse(req.query);
  sendSuccess(res, await clientPaymentSummaryService.summarize(getAuthUser(req), query));
}

export async function getClientPayment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await clientPaymentService.getById(getAuthUser(req), id));
}

export async function createClientPayment(req: Request, res: Response): Promise<void> {
  const input = createClientPaymentSchema.parse(req.body);
  sendSuccess(res, await clientPaymentService.create(getAuthUser(req), input), 201);
}

export async function updateClientPayment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateClientPaymentSchema.parse(req.body);
  sendSuccess(res, await clientPaymentService.update(getAuthUser(req), id, input));
}

export async function deleteClientPayment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await clientPaymentService.remove(getAuthUser(req), id);
  res.status(204).end();
}

export const clientPaymentAttachments = createAttachmentController(
  clientPaymentService.attachments,
);
