import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { API_PREFIX, API_ROUTES, REQUEST_ID_HEADER } from '@umc/shared';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { requestLogger } from './middlewares/request-logger.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { mountLocalStorage } from './lib/storage/local-storage.static.js';

const BODY_LIMIT = '1mb';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Decides which X-Forwarded-For hops are believed for `req.ip`, which rate limits key on.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(requestLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
      // Content-Disposition carries the file name of downloads such as invoice PDFs.
      exposedHeaders: [REQUEST_ID_HEADER, 'Content-Disposition'],
    }),
  );
  app.use(compression());
  // Webhook signatures cover the exact bytes received, so these bodies are kept raw.
  app.use(
    `${API_PREFIX}${API_ROUTES.webhooks.base}`,
    express.raw({ type: 'application/json', limit: BODY_LIMIT }),
  );
  // JSON only: HTML forms can post urlencoded bodies cross-site without a CORS preflight.
  app.use(express.json({ limit: BODY_LIMIT }));
  app.use(cookieParser());

  mountLocalStorage(app);
  app.use(API_PREFIX, apiRouter);

  // Must stay last: 404 for unmatched routes, then the centralized error handler.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
