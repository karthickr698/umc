import type { HealthStatus } from '@umc/shared';
import { env } from '../config/env.js';
import { checkDatabaseHealth } from '../config/database.js';
import { ApiError } from '../utils/api-error.js';

export async function getHealthStatus(): Promise<HealthStatus> {
  const database = await checkDatabaseHealth();
  return {
    status: database.status === 'connected' ? 'ok' : 'degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: env.appVersion,
    database: database.status,
    ...(database.latencyMs !== undefined && { databaseLatencyMs: database.latencyMs }),
  };
}

/** Resolves when the API can serve traffic that depends on MongoDB; otherwise throws a 503. */
export async function getReadiness(): Promise<HealthStatus> {
  const health = await getHealthStatus();
  if (health.database !== 'connected') {
    throw ApiError.serviceUnavailable('Service is not ready', health);
  }
  return health;
}
