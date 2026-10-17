import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  GetFileUrlOptions,
  ReadFileResult,
  StorageService,
  StoredFile,
  UploadFileInput,
} from './storage.types.js';
import { assertValidStorageKey } from './storage-key.js';

export interface S3StorageOptions {
  bucket: string;
  region: string;
  /** Custom endpoint for S3-compatible providers (Cloudflare R2, MinIO, ...). */
  endpoint?: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  /** Lifetime of the signed URLs returned by `getUrl` unless the caller asks otherwise. */
  urlExpiresInSeconds: number;
}

/**
 * Stores files in a private S3-compatible bucket and hands out short-lived signed URLs, so it
 * works on hosts without a persistent disk (e.g. Vercel).
 */
export class S3StorageService implements StorageService {
  readonly driver = 's3' as const;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly urlExpiresInSeconds: number;

  constructor(options: S3StorageOptions) {
    this.bucket = options.bucket;
    this.urlExpiresInSeconds = options.urlExpiresInSeconds;
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async upload({ key, body, contentType }: UploadFileInput): Promise<StoredFile> {
    assertValidStorageKey(key);
    // S3 needs the length up front, so streams are buffered (callers already hold small files).
    const bytes = body instanceof Readable ? await buffer(body) : body;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: contentType,
        // Keys are never overwritten, matching the local driver.
        IfNoneMatch: '*',
      }),
    );
    return { key, size: bytes.byteLength, contentType };
  }

  async read(key: string): Promise<ReadFileResult | null> {
    assertValidStorageKey(key);
    try {
      const { Body, ContentLength } = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!(Body instanceof Readable)) {
        throw new Error(`Unexpected S3 response body for ${JSON.stringify(key)}`);
      }
      return { body: Body, size: ContentLength ?? 0 };
    } catch (err) {
      if (err instanceof NoSuchKey) return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    assertValidStorageKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  getUrl(key: string, options: GetFileUrlOptions = {}): Promise<string> {
    assertValidStorageKey(key);
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: options.expiresInSeconds ?? this.urlExpiresInSeconds,
    });
  }
}
