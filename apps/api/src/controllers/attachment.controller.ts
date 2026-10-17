import type { Request, Response } from 'express';
import { ATTACHMENT_UPLOAD_FIELD } from '@umc/shared';
import { getAuthUser } from '../middlewares/authenticate.js';
import type { AttachmentService } from '../services/attachment.service.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  attachmentParamsSchema,
  uploadAttachmentsSchema,
} from '../validators/attachment.validator.js';
import { idParamsSchema } from '../validators/common.validator.js';

type Handler = (req: Request, res: Response) => Promise<void>;

export interface AttachmentController {
  listAttachments: Handler;
  /** Expects `uploadAttachments` to have buffered the files into `req.files`. */
  uploadAttachments: Handler;
  deleteAttachment: Handler;
}

export function createAttachmentController(service: AttachmentService): AttachmentController {
  return {
    async listAttachments(req, res) {
      const { id } = idParamsSchema.parse(req.params);
      sendSuccess(res, await service.list(getAuthUser(req), id));
    },

    async uploadAttachments(req, res) {
      const { id } = idParamsSchema.parse(req.params);
      const input = uploadAttachmentsSchema.parse({ [ATTACHMENT_UPLOAD_FIELD]: req.files });
      const files = input[ATTACHMENT_UPLOAD_FIELD];
      sendSuccess(res, await service.add(getAuthUser(req), id, files), 201);
    },

    async deleteAttachment(req, res) {
      const { id, attachmentId } = attachmentParamsSchema.parse(req.params);
      await service.remove(getAuthUser(req), id, attachmentId);
      res.status(204).end();
    },
  };
}
