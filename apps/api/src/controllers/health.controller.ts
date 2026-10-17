import type { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import * as healthService from '../services/health.service.js';

// Liveness: the process is up and serving requests.
export async function getLiveness(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await healthService.getHealthStatus());
}

// Readiness: the process can serve traffic that depends on MongoDB.
export async function getReadiness(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, await healthService.getReadiness());
}
