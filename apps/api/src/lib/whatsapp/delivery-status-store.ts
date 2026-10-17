import {
  WHATSAPP_DELIVERY_STATUSES,
  type WhatsAppDeliveryStatus,
  type WhatsAppDeliveryStatusResult,
} from './whatsapp.types.js';

/**
 * Where delivery statuses reported by the provider (via webhooks) are kept so they can be
 * looked up by message id.
 */
export interface WhatsAppDeliveryStatusStore {
  get(messageId: string): Promise<WhatsAppDeliveryStatusResult | null>;
  /** Applies an update unless it would move the message backwards (see `shouldReplaceStatus`). */
  record(update: WhatsAppDeliveryStatusResult): Promise<void>;
}

const STATUS_RANK: Record<WhatsAppDeliveryStatus, number> = Object.fromEntries(
  WHATSAPP_DELIVERY_STATUSES.map((status, index) => [status, index]),
) as Record<WhatsAppDeliveryStatus, number>;

/** Webhooks can arrive out of order; never let e.g. a late `sent` overwrite `read`. */
export function shouldReplaceStatus(
  current: WhatsAppDeliveryStatus,
  next: WhatsAppDeliveryStatus,
): boolean {
  if (current === 'failed') return false;
  return STATUS_RANK[next] > STATUS_RANK[current];
}

const DEFAULT_MAX_ENTRIES = 10_000;

/**
 * Process-local store. Statuses are lost on restart and not shared between instances, so
 * production deployments should provide a persistent implementation.
 */
export class InMemoryDeliveryStatusStore implements WhatsAppDeliveryStatusStore {
  private readonly entries = new Map<string, WhatsAppDeliveryStatusResult>();

  constructor(private readonly maxEntries = DEFAULT_MAX_ENTRIES) {}

  get(messageId: string): Promise<WhatsAppDeliveryStatusResult | null> {
    return Promise.resolve(this.entries.get(messageId) ?? null);
  }

  record(update: WhatsAppDeliveryStatusResult): Promise<void> {
    const current = this.entries.get(update.messageId);
    if (current && !shouldReplaceStatus(current.status, update.status)) {
      return Promise.resolve();
    }

    // Re-insert so Map iteration order doubles as least-recently-updated eviction order.
    this.entries.delete(update.messageId);
    this.entries.set(update.messageId, update);
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (!oldest.done) this.entries.delete(oldest.value);
    }
    return Promise.resolve();
  }
}
