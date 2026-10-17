import {
  ATTACHMENT_LIMITS,
  ATTACHMENT_UPLOAD_FIELD,
  type AttachmentDto,
  type TenantUserDto,
} from '@umc/shared';
import { logger } from '../config/logger.js';
import { buildStorageKey, storage } from '../lib/storage/index.js';
import { ApiError } from '../utils/api-error.js';
import type { AttachmentRepository } from '../utils/attachment-queries.js';
import type { Attachment, NewAttachment } from '../utils/attachment-schema.js';
import { imageExtension } from '../utils/image-type.js';
import type { AttachmentUpload } from '../validators/attachment.validator.js';

export async function toAttachmentDtos(
  attachments: readonly Attachment[],
): Promise<AttachmentDto[]> {
  return Promise.all(
    attachments.map(async (attachment) => ({
      id: attachment._id.toString(),
      fileName: attachment.fileName,
      contentType: attachment.contentType,
      size: attachment.size,
      url: await storage.getUrl(attachment.key),
      uploadedBy: attachment.uploadedBy.toString(),
      uploadedAt: attachment.uploadedAt.toISOString(),
    })),
  );
}

/**
 * Best effort: a file left behind only costs storage, so a failed delete is logged instead of
 * failing the request that removed its record.
 */
export async function deleteStoredFiles(
  attachments: readonly Pick<Attachment, 'key'>[],
): Promise<void> {
  const results = await Promise.allSettled(attachments.map(({ key }) => storage.delete(key)));
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn(
        { err: result.reason, key: attachments[index]?.key },
        'Failed to delete attachment file',
      );
    }
  });
}

function limitExceeded(currentCount: number): ApiError {
  const remaining = Math.max(ATTACHMENT_LIMITS.maxFilesPerRecord - currentCount, 0);
  return ApiError.validation([
    {
      path: ATTACHMENT_UPLOAD_FIELD,
      message: `A record can have at most ${ATTACHMENT_LIMITS.maxFilesPerRecord} attachments; ${remaining} more can be added`,
    },
  ]);
}

export interface AttachmentOwner {
  /** Storage folder below the company's, e.g. `payments`. */
  folder: string;
  /** 404 message when the owning record does not exist. */
  notFoundMessage: string;
  repository: AttachmentRepository;
}

export interface AttachmentService {
  list(actor: TenantUserDto, id: string): Promise<AttachmentDto[]>;
  /** Resolves to every attachment of the record, including the new ones. */
  add(actor: TenantUserDto, id: string, files: AttachmentUpload[]): Promise<AttachmentDto[]>;
  remove(actor: TenantUserDto, id: string, attachmentId: string): Promise<void>;
}

/** Image attachments of one kind of record; files go to storage, metadata to the record. */
export function createAttachmentService({
  folder,
  notFoundMessage,
  repository,
}: AttachmentOwner): AttachmentService {
  /** Uploads every file or none: on any failure the files already stored are removed. */
  async function storeFiles(
    actor: TenantUserDto,
    id: string,
    files: AttachmentUpload[],
  ): Promise<NewAttachment[]> {
    const uploadedAt = new Date();
    const results = await Promise.allSettled(
      files.map(async (file): Promise<NewAttachment> => {
        const key = buildStorageKey({
          folder: `companies/${actor.companyId}/${folder}/${id}`,
          // The extension comes from the detected type, never the client's file name, so files
          // are always served with an image content type.
          originalName: `image${imageExtension(file.contentType)}`,
        });
        const { size } = await storage.upload({
          key,
          body: file.body,
          contentType: file.contentType,
        });
        return {
          key,
          fileName: file.fileName,
          contentType: file.contentType,
          size,
          uploadedBy: actor.id,
          uploadedAt,
        };
      }),
    );

    const stored = results.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) {
      await deleteStoredFiles(stored);
      throw failure.reason;
    }
    return stored;
  }

  return {
    async list(actor, id) {
      const attachments = await repository.find(actor.companyId, id);
      if (!attachments) throw ApiError.notFound(notFoundMessage);
      return toAttachmentDtos(attachments);
    },

    async add(actor, id, files) {
      const { companyId } = actor;
      // Checked up front to avoid storing files that cannot be attached; `repository.add`
      // enforces the limit again atomically.
      const current = await repository.find(companyId, id);
      if (!current) throw ApiError.notFound(notFoundMessage);
      if (current.length + files.length > ATTACHMENT_LIMITS.maxFilesPerRecord) {
        throw limitExceeded(current.length);
      }

      const stored = await storeFiles(actor, id, files);
      let updated: Attachment[] | null;
      try {
        updated = await repository.add(companyId, id, stored);
      } catch (err) {
        await deleteStoredFiles(stored);
        throw err;
      }

      if (!updated) {
        // The record was deleted or filled up by a concurrent request.
        await deleteStoredFiles(stored);
        const latest = await repository.find(companyId, id);
        throw latest ? limitExceeded(latest.length) : ApiError.notFound(notFoundMessage);
      }
      return toAttachmentDtos(updated);
    },

    async remove(actor, id, attachmentId) {
      const removed = await repository.remove(actor.companyId, id, attachmentId);
      if (!removed) throw ApiError.notFound('Attachment not found');
      await deleteStoredFiles([removed]);
    },
  };
}
