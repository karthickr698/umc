import express from 'express';
import { createApp } from './app.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './config/database.js';

/**
 * Serverless entry point (the `api` service in vercel.json). Replaces `server.ts`: there is no
 * port to listen on or signal to handle, and warm instances reuse the app and its MongoDB
 * connection across requests.
 */
let connecting: Promise<void> | undefined;

function ensureDatabase(): Promise<void> {
  connecting ??= connectDatabase().catch((err: unknown) => {
    // Retry on the next request; this one continues and fails with 503 if it needs the database.
    connecting = undefined;
    logger.error({ err }, 'Failed to connect to MongoDB');
  });
  return connecting;
}

const app = express();
app.disable('x-powered-by');
app.use(async (_req, _res, next) => {
  await ensureDatabase();
  next();
});
app.use(createApp());

export default app;
