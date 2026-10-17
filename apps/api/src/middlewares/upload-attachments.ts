import type { RequestHandler } from 'express';
import multer from 'multer';
import { ATTACHMENT_LIMITS, ATTACHMENT_UPLOAD_FIELD } from '@umc/shared';
import { ApiError } from '../utils/api-error.js';
import { ACCEPTED_IMAGE_TYPES_MESSAGE, isAcceptedImageType } from '../utils/image-type.js';

// Files are buffered in memory so their contents can be checked before anything is stored; the
// limits cap that at `maxFilesPerRecord * maxFileSizeBytes` per request.
const parseFiles = multer({
  storage: multer.memoryStorage(),
  defParamCharset: 'utf8',
  limits: {
    fileSize: ATTACHMENT_LIMITS.maxFileSizeBytes,
    files: ATTACHMENT_LIMITS.maxFilesPerRecord,
    fields: 0,
  },
  fileFilter: (_req, file, accept) => {
    if (isAcceptedImageType(file.mimetype)) {
      accept(null, true);
    } else {
      accept(
        ApiError.validation([
          {
            path: ATTACHMENT_UPLOAD_FIELD,
            message: `${file.originalname}: ${ACCEPTED_IMAGE_TYPES_MESSAGE}`,
          },
        ]),
      );
    }
  },
}).array(ATTACHMENT_UPLOAD_FIELD, ATTACHMENT_LIMITS.maxFilesPerRecord);

/**
 * Buffers the images of a multipart upload into `req.files`; the controller validates their
 * contents. Mount after `authenticate` and the role/ownership guards so callers who may not upload
 * cannot make the API buffer files.
 */
export const uploadAttachments: RequestHandler = (req, res, next) => {
  parseFiles(req, res, (err?: unknown) => {
    if (!err || err instanceof ApiError || err instanceof multer.MulterError) {
      next(err);
    } else {
      // Busboy reports truncated or malformed bodies as plain errors.
      next(ApiError.badRequest('Malformed multipart body'));
    }
  });
};
