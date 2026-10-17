import { z } from 'zod';
import type { WhatsAppDeliveryStatusStore } from '../delivery-status-store.js';
import { toWhatsAppNumber } from '../phone-number.js';
import { WHATSAPP_ERROR_CODES, WhatsAppError } from '../whatsapp-error.js';
import type {
  SendWhatsAppDocumentInput,
  SendWhatsAppMessageInput,
  WhatsAppDeliveryStatusResult,
  WhatsAppDocumentSource,
  WhatsAppMessageContent,
  WhatsAppSendResult,
  WhatsAppService,
} from '../whatsapp.types.js';
import { MetaGraphClient, type MetaGraphClientOptions } from './meta-graph-client.js';
import { parseMetaStatusWebhook } from './meta-webhook.js';

export interface MetaWhatsAppOptions extends MetaGraphClientOptions {
  /** WhatsApp Business phone number id (not the phone number itself). */
  phoneNumberId: string;
  statusStore: WhatsAppDeliveryStatusStore;
}

const sendResponseSchema = z.object({
  contacts: z.array(z.object({ input: z.string(), wa_id: z.string() })).optional(),
  messages: z.array(z.object({ id: z.string() })).min(1),
});

const mediaUploadResponseSchema = z.object({ id: z.string() });

const MAX_TEXT_LENGTH = 4096;
const MAX_CAPTION_LENGTH = 1024;

type MetaMediaRef = { link: string } | { id: string };

type MetaTemplateComponent =
  | {
      type: 'header';
      parameters: { type: 'document'; document: MetaMediaRef & { filename: string } }[];
    }
  | { type: 'body'; parameters: { type: 'text'; text: string }[] };

type MetaMessagePayload =
  | { type: 'text'; text: { body: string; preview_url: boolean } }
  | {
      type: 'template';
      template: {
        name: string;
        language: { code: string };
        components?: MetaTemplateComponent[];
      };
    }
  | {
      type: 'document';
      document: MetaMediaRef & { filename: string; caption?: string };
    };

/**
 * WhatsApp Cloud API driver. Meta has no endpoint to look up a message's status, so statuses
 * come from webhooks: route them to `applyStatusWebhook` and read them via `getDeliveryStatus`.
 */
export class MetaWhatsAppService implements WhatsAppService {
  readonly provider = 'meta' as const;
  private readonly client: MetaGraphClient;
  private readonly phoneNumberId: string;
  private readonly statusStore: WhatsAppDeliveryStatusStore;

  constructor({ phoneNumberId, statusStore, ...clientOptions }: MetaWhatsAppOptions) {
    this.client = new MetaGraphClient(clientOptions);
    this.phoneNumberId = phoneNumberId;
    this.statusStore = statusStore;
  }

  async sendMessage({ to, message }: SendWhatsAppMessageInput): Promise<WhatsAppSendResult> {
    // Validate the recipient before uploading any header document.
    const recipient = toWhatsAppNumber(to);
    const header =
      message.type === 'template' && message.headerDocument
        ? {
            ...(await this.resolveDocumentSource(
              message.headerDocument.document,
              message.headerDocument.fileName,
            )),
            filename: message.headerDocument.fileName,
          }
        : undefined;
    return this.send(recipient, toMessagePayload(message, header));
  }

  async sendDocument({
    to,
    document,
    fileName,
    caption,
  }: SendWhatsAppDocumentInput): Promise<WhatsAppSendResult> {
    if (caption !== undefined && caption.length > MAX_CAPTION_LENGTH) {
      throw invalidRequest(`Caption must be at most ${MAX_CAPTION_LENGTH} characters`);
    }
    const recipient = toWhatsAppNumber(to);
    const source = await this.resolveDocumentSource(document, fileName);
    return this.send(recipient, {
      type: 'document',
      document: { ...source, filename: fileName, ...(caption && { caption }) },
    });
  }

  getDeliveryStatus(messageId: string): Promise<WhatsAppDeliveryStatusResult | null> {
    return this.statusStore.get(messageId);
  }

  /**
   * Records the status updates in a webhook payload. Verify the request first with
   * `verifyMetaWebhookSignature`. Returns the updates that were found.
   */
  async applyStatusWebhook(payload: unknown): Promise<WhatsAppDeliveryStatusResult[]> {
    const updates = parseMetaStatusWebhook(payload, this.phoneNumberId);
    for (const update of updates) {
      await this.statusStore.record(update);
    }
    return updates;
  }

  private async send(to: string, payload: MetaMessagePayload): Promise<WhatsAppSendResult> {
    const recipient = toWhatsAppNumber(to);
    const response = await this.client.postJson(
      `${this.phoneNumberId}/messages`,
      { messaging_product: 'whatsapp', recipient_type: 'individual', to: recipient, ...payload },
      sendResponseSchema,
    );

    // `min(1)` in the schema guarantees the first message exists.
    const messageId = response.messages[0]!.id;
    const result: WhatsAppSendResult = {
      messageId,
      recipient: response.contacts?.[0]?.wa_id ?? recipient,
      status: 'accepted',
    };
    await this.statusStore.record({
      messageId,
      status: result.status,
      recipient: result.recipient,
      updatedAt: new Date(),
    });
    return result;
  }

  private async resolveDocumentSource(
    document: WhatsAppDocumentSource,
    fileName: string,
  ): Promise<MetaMediaRef> {
    switch (document.kind) {
      case 'url':
        if (!isHttpsUrl(document.url)) {
          throw invalidRequest('Document URL must be a public https URL');
        }
        return { link: document.url };
      case 'media':
        return { id: document.mediaId };
      case 'buffer':
        return { id: await this.uploadMedia(document.content, document.mimeType, fileName) };
    }
  }

  private async uploadMedia(
    content: Buffer | Uint8Array,
    mimeType: string,
    fileName: string,
  ): Promise<string> {
    const form = new FormData();
    form.append('messaging_product', 'whatsapp');
    form.append('type', mimeType);
    form.append('file', new Blob([content], { type: mimeType }), fileName);
    const { id } = await this.client.postForm(
      `${this.phoneNumberId}/media`,
      form,
      mediaUploadResponseSchema,
    );
    return id;
  }
}

function toMessagePayload(
  message: WhatsAppMessageContent,
  headerDocument?: MetaMediaRef & { filename: string },
): MetaMessagePayload {
  switch (message.type) {
    case 'text':
      if (!message.body.trim() || message.body.length > MAX_TEXT_LENGTH) {
        throw invalidRequest(`Message text must be 1-${MAX_TEXT_LENGTH} characters`);
      }
      return {
        type: 'text',
        text: { body: message.body, preview_url: message.previewUrl ?? false },
      };
    case 'template': {
      const parameters = message.bodyParameters ?? [];
      const components: MetaTemplateComponent[] = [];
      if (headerDocument) {
        components.push({
          type: 'header',
          parameters: [{ type: 'document', document: headerDocument }],
        });
      }
      if (parameters.length > 0) {
        components.push({
          type: 'body',
          parameters: parameters.map((text) => ({ type: 'text', text })),
        });
      }
      return {
        type: 'template',
        template: {
          name: message.name,
          language: { code: message.languageCode },
          ...(components.length > 0 && { components }),
        },
      };
    }
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function invalidRequest(message: string): WhatsAppError {
  return new WhatsAppError(WHATSAPP_ERROR_CODES.INVALID_REQUEST, message);
}
