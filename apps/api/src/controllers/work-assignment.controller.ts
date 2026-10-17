import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as workAssignmentBulkService from '../services/work-assignment-bulk.service.js';
import * as workAssignmentService from '../services/work-assignment.service.js';
import { createAttachmentController } from './attachment.controller.js';
import { sendSuccess } from '../utils/api-response.js';
import { idParamsSchema, workerParamsSchema } from '../validators/common.validator.js';
import {
  bulkCreateWorkAssignmentsSchema,
  createWorkAssignmentSchema,
  dailyParamsSchema,
  dailyWorkAssignmentsQuerySchema,
  listWorkAssignmentsQuerySchema,
  siteParamsSchema,
  siteWorkAssignmentsQuerySchema,
  updateWorkAssignmentSchema,
  workerWorkAssignmentsQuerySchema,
} from '../validators/work-assignment.validator.js';

export async function listWorkAssignments(req: Request, res: Response): Promise<void> {
  const query = listWorkAssignmentsQuerySchema.parse(req.query);
  sendSuccess(res, await workAssignmentService.list(getAuthUser(req), query));
}

export async function listDailyWorkAssignments(req: Request, res: Response): Promise<void> {
  const { date } = dailyParamsSchema.parse(req.params);
  const query = dailyWorkAssignmentsQuerySchema.parse(req.query);
  sendSuccess(res, await workAssignmentService.listDaily(getAuthUser(req), date, query));
}

export async function listSiteWorkAssignments(req: Request, res: Response): Promise<void> {
  const { siteId } = siteParamsSchema.parse(req.params);
  const query = siteWorkAssignmentsQuerySchema.parse(req.query);
  sendSuccess(res, await workAssignmentService.listForSite(getAuthUser(req), siteId, query));
}

export async function listWorkerWorkAssignments(req: Request, res: Response): Promise<void> {
  const { workerId } = workerParamsSchema.parse(req.params);
  const query = workerWorkAssignmentsQuerySchema.parse(req.query);
  sendSuccess(res, await workAssignmentService.listForWorker(getAuthUser(req), workerId, query));
}

export async function getWorkAssignment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  sendSuccess(res, await workAssignmentService.getById(getAuthUser(req), id));
}

export async function createWorkAssignment(req: Request, res: Response): Promise<void> {
  const input = createWorkAssignmentSchema.parse(req.body);
  sendSuccess(res, await workAssignmentService.create(getAuthUser(req), input), 201);
}

/** 201 when at least one assignment was created, otherwise 200 with only failures. */
export async function bulkCreateWorkAssignments(req: Request, res: Response): Promise<void> {
  const input = bulkCreateWorkAssignmentsSchema.parse(req.body);
  const result = await workAssignmentBulkService.bulkCreate(getAuthUser(req), input);
  sendSuccess(res, result, result.succeeded.length > 0 ? 201 : 200);
}

export async function updateWorkAssignment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  const input = updateWorkAssignmentSchema.parse(req.body);
  sendSuccess(res, await workAssignmentService.update(getAuthUser(req), id, input));
}

export async function deleteWorkAssignment(req: Request, res: Response): Promise<void> {
  const { id } = idParamsSchema.parse(req.params);
  await workAssignmentService.remove(getAuthUser(req), id);
  res.status(204).end();
}

export const workAssignmentAttachments = createAttachmentController(
  workAssignmentService.attachments,
);
