import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import {
  WHATSAPP_DELIVERY_STATUSES,
  type WhatsAppDeliveryStatusResult,
} from '../whatsapp.types.js';

const SIGNATURE_PREFIX = 'sha256=';

/**
 * Verifies Meta's `X-Hub-Signature-256` header. `rawBody` must be the exact bytes received,
 * before any JSON parsing.
 */
export function verifyMetaWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith(SIGNATURE_PREFIX)) return false;
  const received = Buffer.from(signatureHeader.slice(SIGNATURE_PREFIX.length), 'hex');
  const expected = createHmac('sha256', appSecret).update(rawBody).digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}

const statusSchema = z.object({
  id: z.string(),
  // Unknown statuses (e.g. newer Meta additions) are skipped rather than rejecting the payload.
  status: z.string(),
  timestamp: z.string(),
  recipient_id: z.string().optional(),
  errors: z
    .array(
      z.object({
        code: z.number().optional(),
        title: z.string().optional(),
        message: z.string().optional(),
      }),
    )
    .optional(),
});

const webhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            metadata: z.object({ phone_number_id: z.string() }).optional(),
            statuses: z.array(statusSchema).optional(),
          }),
        }),
      ),
    }),
  ),
});

const deliveryStatusSchema = z.enum(WHATSAPP_DELIVERY_STATUSES);

/**
 * Extracts message status updates from a Meta webhook payload. Returns an empty list for
 * payloads that carry no statuses (e.g. inbound messages). When `phoneNumberId` is given,
 * updates for other business numbers on the same app are ignored.
 */
export function parseMetaStatusWebhook(
  payload: unknown,
  phoneNumberId?: string,
): WhatsAppDeliveryStatusResult[] {
  const parsed = webhookSchema.safeParse(payload);
  if (!parsed.success) return [];

  return parsed.data.entry
    .flatMap((entry) => entry.changes)
    .filter(
      (change) =>
        change.field === 'messages' &&
        (phoneNumberId === undefined || change.value.metadata?.phone_number_id === phoneNumberId),
    )
    .flatMap((change) => change.value.statuses ?? [])
    .flatMap((update): WhatsAppDeliveryStatusResult[] => {
      const status = deliveryStatusSchema.safeParse(update.status);
      const seconds = Number(update.timestamp);
      if (!status.success || !Number.isFinite(seconds)) return [];
      return [
        {
          messageId: update.id,
          status: status.data,
          updatedAt: new Date(seconds * 1000),
          ...(update.recipient_id && { recipient: update.recipient_id }),
          ...(update.errors?.length && { errors: update.errors }),
        },
      ];
    });
}
