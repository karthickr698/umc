import type { Request, Response } from 'express';
import * as whatsappWebhookService from '../services/whatsapp-webhook.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';

const META_SIGNATURE_HEADER = 'x-hub-signature-256';

/** Meta's subscription handshake expects the challenge echoed back as plain text. */
export function verifyWhatsappWebhook(req: Request, res: Response): void {
  const challenge = whatsappWebhookService.verifySubscription(
    req.query['hub.mode'],
    req.query['hub.verify_token'],
    req.query['hub.challenge'],
  );
  res.type('text/plain').send(challenge);
}

export async function receiveWhatsappWebhook(req: Request, res: Response): Promise<void> {
  // `app.ts` parses this route's JSON bodies as raw bytes so the signature can be checked.
  if (!Buffer.isBuffer(req.body)) throw ApiError.badRequest('Expected a JSON body');
  const updates = await whatsappWebhookService.handleStatusWebhook(
    req.body,
    req.get(META_SIGNATURE_HEADER),
  );
  sendSuccess(res, { updates });
}
