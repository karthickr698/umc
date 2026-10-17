import type { AttachmentContentType } from '../constants/domain.js';

/**
 * An image attached to a payment, expense, client payment or work assignment. The file itself
 * lives in file storage; only this metadata is kept with the record.
 */
export interface AttachmentDto {
  id: string;
  /** Name of the uploaded file, stripped of any path. */
  fileName: string;
  /** Detected from the file contents. */
  contentType: AttachmentContentType;
  /** In bytes. */
  size: number;
  /** Where the file can be downloaded; may expire for drivers that sign URLs. */
  url: string;
  /** User who uploaded the file. */
  uploadedBy: string;
  uploadedAt: string;
}
