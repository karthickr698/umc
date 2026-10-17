import { Types, type Model, type QueryFilter, type UpdateQuery } from 'mongoose';
import { ATTACHMENT_LIMITS } from '@umc/shared';
import type { Attachment, NewAttachment } from './attachment-schema.js';

interface WithAttachments {
  companyId: Types.ObjectId;
  attachments: Attachment[];
}

interface AttachmentsProjection {
  attachments: Attachment[];
}

/** Attachment access for one company-scoped model; every method is scoped by `companyId`. */
export interface AttachmentRepository {
  /** `null` when the record does not exist in the company. */
  find(companyId: string, id: string): Promise<Attachment[] | null>;
  /**
   * Appends atomically, only while the record stays within `ATTACHMENT_LIMITS.maxFilesPerRecord`.
   * Resolves to the full list, or `null` when the record is missing or the limit would be exceeded.
   */
  add(companyId: string, id: string, attachments: NewAttachment[]): Promise<Attachment[] | null>;
  /** Resolves to the removed attachment, or `null` when the record or attachment does not exist. */
  remove(companyId: string, id: string, attachmentId: string): Promise<Attachment | null>;
}

export function createAttachmentRepository<T extends WithAttachments>(
  model: Model<T>,
): AttachmentRepository {
  return {
    async find(companyId, id) {
      if (!Types.ObjectId.isValid(id)) return null;
      const record = await model
        .findOne({ _id: id, companyId } as QueryFilter<T>)
        .select('attachments')
        .lean<AttachmentsProjection>()
        .exec();
      return record?.attachments ?? null;
    },

    async add(companyId, id, attachments) {
      const freeIndex = ATTACHMENT_LIMITS.maxFilesPerRecord - attachments.length;
      if (!Types.ObjectId.isValid(id) || freeIndex < 0) return null;
      // Matches only while the record holds at most `freeIndex` attachments, so concurrent uploads
      // cannot push it past the limit.
      const filter = { _id: id, companyId, [`attachments.${freeIndex}`]: { $exists: false } };
      const update = { $push: { attachments: { $each: attachments } } };
      const record = await model
        .findOneAndUpdate(filter as QueryFilter<T>, update as UpdateQuery<T>, {
          returnDocument: 'after',
          runValidators: true,
          projection: { attachments: 1 },
        })
        .lean<AttachmentsProjection>()
        .exec();
      return record?.attachments ?? null;
    },

    async remove(companyId, id, attachmentId) {
      if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(attachmentId)) return null;
      const filter = { _id: id, companyId, 'attachments._id': attachmentId };
      const update = { $pull: { attachments: { _id: attachmentId } } };
      const before = await model
        .findOneAndUpdate(filter as QueryFilter<T>, update as UpdateQuery<T>, {
          returnDocument: 'before',
          projection: { attachments: 1 },
        })
        .lean<AttachmentsProjection>()
        .exec();
      return before?.attachments.find((attachment) => attachment._id.equals(attachmentId)) ?? null;
    },
  };
}

/**
 * Deletes a company-scoped record and resolves to the attachments it held, so their files can be
 * removed from storage; `null` when nothing was deleted.
 */
export async function deleteReturningAttachments<T extends WithAttachments>(
  model: Model<T>,
  companyId: string,
  id: string,
): Promise<Attachment[] | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  const deleted = await model
    .findOneAndDelete({ _id: id, companyId } as QueryFilter<T>)
    .select('attachments')
    .lean<AttachmentsProjection>()
    .exec();
  return deleted?.attachments ?? null;
}
