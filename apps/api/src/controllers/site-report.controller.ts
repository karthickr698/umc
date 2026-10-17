import type { Request, Response } from 'express';
import { getAuthUser } from '../middlewares/authenticate.js';
import * as siteReportService from '../services/site-report.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { sendFile } from '../utils/send-file.js';
import { siteFinancialReportQuerySchema } from '../validators/site-report.validator.js';

export async function getSiteFinancialReport(req: Request, res: Response): Promise<void> {
  const query = siteFinancialReportQuerySchema.parse(req.query);
  sendSuccess(res, await siteReportService.getSiteFinancialReport(getAuthUser(req), query));
}

export async function exportSiteFinancialReport(req: Request, res: Response): Promise<void> {
  const query = siteFinancialReportQuerySchema.parse(req.query);
  const csv = await siteReportService.exportSiteFinancialReport(getAuthUser(req), query);
  await sendFile(req, res, { ...csv, disposition: 'attachment' });
}
