import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as dashboardService from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { dashboardSummaryQuerySchema } from '../validators/dashboard.validator.js';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  const query = dashboardSummaryQuerySchema.parse(req.query);
  sendSuccess(res, await dashboardService.summarize(getAuthUser(req), query));
}
