import { ATTACHMENT_CONTENT_TYPES, type AttachmentContentType } from '@umc/shared';

interface ImageSignature {
  /** Extension files of this type are stored under, so they are served with the right type. */
  extension: string;
  matches(bytes: Uint8Array): boolean;
}

function hasBytesAt(bytes: Uint8Array, expected: readonly number[] | string, offset = 0): boolean {
  const values =
    typeof expected === 'string' ? [...expected].map((char) => char.charCodeAt(0)) : expected;
  return values.every((value, index) => bytes[offset + index] === value);
}

const IMAGE_SIGNATURES: Record<AttachmentContentType, ImageSignature> = {
  [ATTACHMENT_CONTENT_TYPES.JPEG]: {
    extension: '.jpg',
    matches: (bytes) => hasBytesAt(bytes, [0xff, 0xd8, 0xff]),
  },
  [ATTACHMENT_CONTENT_TYPES.PNG]: {
    extension: '.png',
    matches: (bytes) => hasBytesAt(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  [ATTACHMENT_CONTENT_TYPES.WEBP]: {
    extension: '.webp',
    matches: (bytes) => hasBytesAt(bytes, 'RIFF') && hasBytesAt(bytes, 'WEBP', 8),
  },
};

const ACCEPTED_TYPES = Object.values(ATTACHMENT_CONTENT_TYPES);

/** Extensions attachment images are stored under, e.g. `['.jpg', '.png', '.webp']`. */
export const IMAGE_EXTENSIONS: readonly string[] = ACCEPTED_TYPES.map(
  (type) => IMAGE_SIGNATURES[type].extension,
);

export const ACCEPTED_IMAGE_TYPES_MESSAGE = 'Only JPEG, PNG and WebP images are allowed';

export function isAcceptedImageType(contentType: string): contentType is AttachmentContentType {
  return (ACCEPTED_TYPES as readonly string[]).includes(contentType);
}

/** Identifies an accepted image format from the file's magic bytes, ignoring what the client declared. */
export function detectImageType(bytes: Uint8Array): AttachmentContentType | undefined {
  return ACCEPTED_TYPES.find((type) => IMAGE_SIGNATURES[type].matches(bytes));
}

export function imageExtension(contentType: AttachmentContentType): string {
  return IMAGE_SIGNATURES[contentType].extension;
}
