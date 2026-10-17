import { WHATSAPP_ERROR_CODES, WhatsAppError } from './whatsapp-error.js';
import type {
  WhatsAppDeliveryStatusResult,
  WhatsAppSendResult,
  WhatsAppService,
} from './whatsapp.types.js';

/** Used when no provider is configured, so the API still boots without WhatsApp credentials. */
export class DisabledWhatsAppService implements WhatsAppService {
  readonly provider = 'disabled' as const;

  sendMessage(): Promise<WhatsAppSendResult> {
    return Promise.reject(notConfigured());
  }

  sendDocument(): Promise<WhatsAppSendResult> {
    return Promise.reject(notConfigured());
  }

  getDeliveryStatus(): Promise<WhatsAppDeliveryStatusResult | null> {
    return Promise.resolve(null);
  }
}

function notConfigured(): WhatsAppError {
  return new WhatsAppError(
    WHATSAPP_ERROR_CODES.NOT_CONFIGURED,
    'WhatsApp is not configured; set WHATSAPP_PROVIDER and its credentials',
  );
}
