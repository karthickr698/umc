import { Schema, type SchemaDefinitionProperty, type Types } from 'mongoose';
import {
  ATTACHMENT_CONTENT_TYPES,
  ATTACHMENT_LIMITS,
  FIELD_LIMITS,
  type AttachmentContentType,
} from '@umc/shared';

/** Metadata of a file kept in file storage; the bytes are never stored in MongoDB. */
export interface Attachment {
  _id: Types.ObjectId;
  /** Storage key; URLs are resolved from it on read. */
  key: string;
  fileName: string;
  contentType: AttachmentContentType;
  size: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export type NewAttachment = Omit<Attachment, '_id' | 'uploadedBy'> & { uploadedBy: string };

const attachmentSchema = new Schema<Attachment>({
  key: { type: String, required: true },
  fileName: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.fileName },
  contentType: { type: String, enum: Object.values(ATTACHMENT_CONTENT_TYPES), required: true },
  size: { type: Number, required: true, min: 1, max: ATTACHMENT_LIMITS.maxFileSizeBytes },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, required: true, default: Date.now },
});

/** Images attached to a record; managed through its attachment endpoints. */
export const attachmentsField: SchemaDefinitionProperty<Attachment[]> = {
  type: [attachmentSchema],
  default: [],
  validate: {
    validator: (value: Attachment[]) => value.length <= ATTACHMENT_LIMITS.maxFilesPerRecord,
    message: `attachments cannot exceed ${ATTACHMENT_LIMITS.maxFilesPerRecord} items`,
  },
};
