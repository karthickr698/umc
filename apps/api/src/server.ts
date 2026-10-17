import type { Server } from 'node:http';
import type { Express } from 'express';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { closePdfRenderer } from './lib/pdf/pdf-renderer.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

let server: Server | undefined;
let shuttingDown = false;

function listen(app: Express, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const httpServer = app.listen(port);
    httpServer.once('listening', () => resolve(httpServer));
    httpServer.once('error', reject);
  });
}

function closeServer(httpServer: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
    httpServer.closeIdleConnections();
  });
}

async function closeDatabaseSafely(): Promise<void> {
  try {
    await disconnectDatabase();
  } catch (err) {
    logger.error({ err }, 'Error while disconnecting from MongoDB');
  }
}

async function bootstrap(): Promise<void> {
  await connectDatabase();
  // A signal may have arrived while we were waiting for MongoDB.
  if (shuttingDown) return;

  server = await listen(createApp(), env.PORT);
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`${signal} received, shutting down gracefully`);

  // Still waiting for MongoDB: nothing to drain, and disconnecting would block until the attempt times out.
  if (!server) {
    logger.info('Startup aborted');
    process.exit(0);
  }

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  let exitCode = 0;
  try {
    await closeServer(server);
    logger.info('HTTP server closed');
  } catch (err) {
    logger.error({ err }, 'Error while closing HTTP server');
    exitCode = 1;
  }
  await closePdfRenderer();
  await closeDatabaseSafely();
  logger.info('Shutdown complete');
  process.exit(exitCode);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

bootstrap().catch(async (err: unknown) => {
  if (shuttingDown) return;
  logger.fatal({ err }, 'Failed to start API');
  await closeDatabaseSafely();
  process.exit(1);
});
