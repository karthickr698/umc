import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as workerSummaryService from '../services/worker-summary.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { workerParamsSchema } from '../validators/common.validator.js';
import {
  listWorkerSummariesQuerySchema,
  workerSummaryQuerySchema,
} from '../validators/worker-summary.validator.js';

export async function listWorkerSummaries(req: Request, res: Response): Promise<void> {
  const query = listWorkerSummariesQuerySchema.parse(req.query);
  sendSuccess(res, await workerSummaryService.list(getAuthUser(req), query));
}

export async function getWorkerSummary(req: Request, res: Response): Promise<void> {
  const { workerId } = workerParamsSchema.parse(req.params);
  const query = workerSummaryQuerySchema.parse(req.query);
  sendSuccess(res, await workerSummaryService.getForWorker(getAuthUser(req), workerId, query));
}
