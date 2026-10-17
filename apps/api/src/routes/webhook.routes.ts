import { Router } from 'express';
import { API_ROUTES } from '@umc/shared';
import * as webhookController from '../controllers/webhook.controller.js';

/** Public: providers authenticate each call with a signature instead of a user session. */
export const webhookRouter = Router();

const routes = API_ROUTES.webhooks;

webhookRouter.get(routes.whatsapp, webhookController.verifyWhatsappWebhook);
webhookRouter.post(routes.whatsapp, webhookController.receiveWhatsappWebhook);
