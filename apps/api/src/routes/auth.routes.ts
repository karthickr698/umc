import { Router } from 'express';
import { API_ROUTES } from '@umc/shared';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { loginRateLimit, registerRateLimit } from '../middlewares/rate-limit.js';
import { requireTrustedOrigin } from '../middlewares/require-trusted-origin.js';

export const authRouter = Router();

authRouter.post(
  API_ROUTES.auth.register,
  requireTrustedOrigin,
  registerRateLimit,
  authController.register,
);
authRouter.post(
  API_ROUTES.auth.login,
  requireTrustedOrigin,
  ...loginRateLimit,
  authController.login,
);
authRouter.post(API_ROUTES.auth.refresh, requireTrustedOrigin, authController.refresh);
authRouter.post(API_ROUTES.auth.logout, requireTrustedOrigin, authController.logout);
authRouter.get(API_ROUTES.auth.me, authenticate, authController.me);
