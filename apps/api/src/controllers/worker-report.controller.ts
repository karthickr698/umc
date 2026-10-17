import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as workerReportService from '../services/worker-report.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { sendFile } from '../utils/send-file.js';
import {
  workerFinancialReportExportQuerySchema,
  workerFinancialReportQuerySchema,
} from '../validators/worker-report.validator.js';

export async function getWorkerFinancialReport(req: Request, res: Response): Promise<void> {
  const query = workerFinancialReportQuerySchema.parse(req.query);
  sendSuccess(res, await workerReportService.getWorkerFinancialReport(getAuthUser(req), query));
}

export async function exportWorkerFinancialReport(req: Request, res: Response): Promise<void> {
  const query = workerFinancialReportExportQuerySchema.parse(req.query);
  const csv = await workerReportService.exportWorkerFinancialReport(getAuthUser(req), query);
  await sendFile(req, res, { ...csv, disposition: 'attachment' });
}
