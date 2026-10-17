import { Router } from 'express';
import { API_ROUTES } from '@umc/shared';
import * as healthController from '../controllers/health.controller.js';

export const healthRouter = Router();

healthRouter.get(API_ROUTES.health, healthController.getLiveness);
healthRouter.get(API_ROUTES.healthReady, healthController.getReadiness);
