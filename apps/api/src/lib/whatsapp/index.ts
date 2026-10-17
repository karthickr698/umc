import { env } from '../../config/env.js';
import { InMemoryDeliveryStatusStore } from './delivery-status-store.js';
import { DisabledWhatsAppService } from './disabled-whatsapp.service.js';
import { MetaWhatsAppService } from './meta/meta-whatsapp.service.js';
import type { WhatsAppService } from './whatsapp.types.js';

function createWhatsAppService(): WhatsAppService {
  switch (env.WHATSAPP_PROVIDER) {
    case 'disabled':
      return new DisabledWhatsAppService();
    case 'meta':
      if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
        // Unreachable: the env schema requires both when the provider is `meta`.
        throw new Error('Meta WhatsApp provider is missing its credentials');
      }
      return new MetaWhatsAppService({
        accessToken: env.WHATSAPP_ACCESS_TOKEN,
        phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
        apiVersion: env.WHATSAPP_API_VERSION,
        baseUrl: env.WHATSAPP_API_BASE_URL,
        timeoutMs: env.WHATSAPP_REQUEST_TIMEOUT_MS,
        statusStore: new InMemoryDeliveryStatusStore(),
      });
  }
}

/** The configured WhatsApp provider. Business code depends only on the `WhatsAppService` contract. */
export const whatsapp: WhatsAppService = createWhatsAppService();

export {
  InMemoryDeliveryStatusStore,
  shouldReplaceStatus,
  type WhatsAppDeliveryStatusStore,
} from './delivery-status-store.js';
export { MetaWhatsAppService, type MetaWhatsAppOptions } from './meta/meta-whatsapp.service.js';
export { parseMetaStatusWebhook, verifyMetaWebhookSignature } from './meta/meta-webhook.js';
export { toWhatsAppNumber } from './phone-number.js';
export { WHATSAPP_ERROR_CODES, WhatsAppError, type WhatsAppErrorCode } from './whatsapp-error.js';
export {
  WHATSAPP_DELIVERY_STATUSES,
  WHATSAPP_PROVIDERS,
  type SendWhatsAppDocumentInput,
  type SendWhatsAppMessageInput,
  type WhatsAppDeliveryError,
  type WhatsAppDeliveryStatus,
  type WhatsAppDeliveryStatusResult,
  type WhatsAppDocumentSource,
  type WhatsAppMessageContent,
  type WhatsAppProvider,
  type WhatsAppSendResult,
  type WhatsAppService,
  type WhatsAppTemplateDocumentHeader,
  type WhatsAppTemplateMessage,
  type WhatsAppTextMessage,
} from './whatsapp.types.js';
