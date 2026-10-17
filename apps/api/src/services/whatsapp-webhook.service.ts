import { createHash, timingSafeEqual } from 'node:crypto';
import { INVOICE_WHATSAPP_STATUSES, type InvoiceWhatsappStatus } from '@umc/shared';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import {
  MetaWhatsAppService,
  WHATSAPP_ERROR_CODES,
  WhatsAppError,
  verifyMetaWebhookSignature,
  whatsapp,
  type WhatsAppDeliveryStatus,
  type WhatsAppDeliveryStatusResult,
} from '../lib/whatsapp/index.js';
import * as invoiceRepository from '../repositories/invoice.repository.js';
import { ApiError } from '../utils/api-error.js';
import { whatsappErrorMessage } from '../utils/whatsapp-error.js';

const { SENT, DELIVERED, READ, FAILED } = INVOICE_WHATSAPP_STATUSES;

/** Meta sends a short numeric challenge; anything long is not a genuine handshake. */
const MAX_CHALLENGE_LENGTH = 256;

/** Invoice status for each provider status, and the statuses it may replace (never go back). */
const TRANSITIONS: Readonly<
  Record<WhatsAppDeliveryStatus, { to: InvoiceWhatsappStatus; from: InvoiceWhatsappStatus[] }>
> = {
  accepted: { to: SENT, from: [] },
  sent: { to: SENT, from: [] },
  delivered: { to: DELIVERED, from: [SENT] },
  read: { to: READ, from: [SENT, DELIVERED] },
  failed: { to: FAILED, from: [SENT, DELIVERED] },
};

/** Webhooks need the Meta provider and its app secret to verify signatures; 404 otherwise. */
function metaWebhookConfig(): { service: MetaWhatsAppService; appSecret: string } {
  const appSecret = env.WHATSAPP_APP_SECRET;
  if (!(whatsapp instanceof MetaWhatsAppService) || !appSecret) {
    throw ApiError.notFound('WhatsApp webhooks are not enabled');
  }
  return { service: whatsapp, appSecret };
}

/** Constant-time comparison; hashing first makes both sides the same length. */
function secretsMatch(received: unknown, expected: string): boolean {
  if (typeof received !== 'string') return false;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(received), digest(expected));
}

/** Answers Meta's subscription handshake; resolves to the challenge to echo back. */
export function verifySubscription(mode: unknown, token: unknown, challenge: unknown): string {
  metaWebhookConfig();
  const expected = env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (
    !expected ||
    mode !== 'subscribe' ||
    !secretsMatch(token, expected) ||
    typeof challenge !== 'string' ||
    challenge.length > MAX_CHALLENGE_LENGTH
  ) {
    throw ApiError.forbidden('Webhook verification failed');
  }
  return challenge;
}

function failureReason(update: WhatsAppDeliveryStatusResult): string {
  const [first] = update.errors ?? [];
  return whatsappErrorMessage(
    new WhatsAppError(WHATSAPP_ERROR_CODES.PROVIDER_ERROR, first?.title ?? 'Delivery failed', {
      ...(first?.code !== undefined && { providerCode: first.code }),
    }),
  );
}

async function applyToInvoice(update: WhatsAppDeliveryStatusResult): Promise<void> {
  const { to, from } = TRANSITIONS[update.status];
  if (from.length === 0) return;
  const applied = await invoiceRepository.applyWhatsappDelivery({
    messageId: update.messageId,
    status: to,
    at: update.updatedAt,
    fromStatuses: from,
    ...(to === FAILED && { error: failureReason(update) }),
  });
  if (applied && to === FAILED) {
    logger.warn(
      { messageId: update.messageId, errors: update.errors },
      'Invoice WhatsApp delivery failed',
    );
  }
}

/**
 * Verifies and applies a Meta status webhook. `rawBody` must be the exact bytes received.
 * Resolves to the number of status updates found.
 */
export async function handleStatusWebhook(
  rawBody: Buffer,
  signature: string | undefined,
): Promise<number> {
  const { service, appSecret } = metaWebhookConfig();
  if (!verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
    throw ApiError.unauthorized('Invalid webhook signature');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw ApiError.badRequest('Malformed JSON body');
  }

  const updates = await service.applyStatusWebhook(payload);
  for (const update of updates) {
    await applyToInvoice(update);
  }
  return updates.length;
}
