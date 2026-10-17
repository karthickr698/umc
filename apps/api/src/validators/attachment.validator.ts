import { z } from 'zod';
import { ATTACHMENT_LIMITS, ATTACHMENT_UPLOAD_FIELD, FIELD_LIMITS } from '@umc/shared';
import { toSafeFileName } from '../utils/file-name.js';
import {
  ACCEPTED_IMAGE_TYPES_MESSAGE,
  detectImageType,
  imageExtension,
} from '../utils/image-type.js';
import { MAX_FILE_SIZE_MESSAGE } from '../utils/multer-error.js';
import { objectIdSchema } from './common.validator.js';

export const attachmentParamsSchema = z.object({
  id: objectIdSchema,
  attachmentId: objectIdSchema,
});

/** A file buffered by the `uploadAttachments` middleware; the client's declared type is ignored. */
const uploadedFileSchema = z
  .object({
    originalname: z.string(),
    size: z
      .number()
      .int()
      .min(1, 'File is empty')
      .max(ATTACHMENT_LIMITS.maxFileSizeBytes, MAX_FILE_SIZE_MESSAGE),
    buffer: z.instanceof(Buffer),
  })
  .transform((file, ctx) => {
    const contentType = detectImageType(file.buffer);
    if (contentType === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `${file.originalname}: ${ACCEPTED_IMAGE_TYPES_MESSAGE}`,
      });
      return z.NEVER;
    }
    return {
      fileName: toSafeFileName(
        file.originalname,
        FIELD_LIMITS.fileName,
        `image${imageExtension(contentType)}`,
      ),
      contentType,
      size: file.size,
      body: file.buffer,
    };
  });

const missingFilesMessage = `Attach at least one image in the "${ATTACHMENT_UPLOAD_FIELD}" field`;

/** Parse `{ [ATTACHMENT_UPLOAD_FIELD]: req.files }` so issue paths name the form field. */
export const uploadAttachmentsSchema = z.object({
  [ATTACHMENT_UPLOAD_FIELD]: z
    .array(uploadedFileSchema, { error: missingFilesMessage })
    .min(1, missingFilesMessage)
    .max(ATTACHMENT_LIMITS.maxFilesPerRecord),
});

export type AttachmentUpload = z.output<typeof uploadedFileSchema>;
