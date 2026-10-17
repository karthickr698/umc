import dotenv from 'dotenv';
import { z } from 'zod';
import { STORAGE_DRIVERS } from '../lib/storage/storage.types.js';
import { WHATSAPP_PROVIDERS } from '../lib/whatsapp/whatsapp.types.js';

dotenv.config({ quiet: true });

const MIN_SECRET_LENGTH = 32;

const jwtSecret = z
  .string({ error: 'is required (generate one with `openssl rand -base64 48`)' })
  .min(MIN_SECRET_LENGTH, `must be at least ${MIN_SECRET_LENGTH} characters`);

/** Credentialed CORS needs exact origins, so wildcards, paths and non-http(s) schemes are refused. */
const corsOrigins = z
  .string()
  .default('http://localhost:5173')
  .transform((value) =>
    value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  )
  .pipe(
    z
      .array(
        z.string().refine((origin) => {
          try {
            const url = new URL(origin);
            return /^https?:$/.test(url.protocol) && url.origin === origin;
          } catch {
            return false;
          }
        }, 'must be a comma-separated list of origins like https://app.example.com (no "*", path or trailing slash)'),
      )
      .min(1, 'must list at least one origin'),
  );

/** Express `trust proxy` setting: a hop count, `true`/`false`, or a list of trusted addresses. */
const trustProxy = z
  .string()
  .trim()
  .min(1)
  .default('1')
  .transform((value): number | boolean | string => {
    if (/^\d+$/.test(value)) return Number(value);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z
      .string({ error: 'is required (e.g. mongodb://localhost:27017/umc)' })
      .trim()
      .regex(/^mongodb(\+srv)?:\/\/.+/, 'must be a mongodb:// or mongodb+srv:// connection string'),
    DATABASE_SERVER_SELECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    CORS_ORIGIN: corsOrigins,
    TRUST_PROXY: trustProxy,
    RATE_LIMIT_API_PER_MINUTE: z.coerce.number().int().positive().default(300),
    RATE_LIMIT_LOGIN_FAILURES_PER_15_MIN: z.coerce.number().int().positive().default(10),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    JWT_ACCESS_SECRET: jwtSecret,
    JWT_REFRESH_SECRET: jwtSecret,
    JWT_ACCESS_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60),
    JWT_REFRESH_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(7 * 24 * 60 * 60),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    REFRESH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('strict'),
    STORAGE_DRIVER: z.enum(STORAGE_DRIVERS).default('local'),
    STORAGE_LOCAL_DIR: z.string().trim().min(1).default('uploads'),
    STORAGE_PUBLIC_BASE_URL: z
      .url({ protocol: /^https?$/, error: 'must be an http(s) URL' })
      .optional(),
    STORAGE_S3_BUCKET: z.string().trim().min(1).optional(),
    STORAGE_S3_REGION: z.string().trim().min(1).default('us-east-1'),
    STORAGE_S3_ENDPOINT: z
      .url({ protocol: /^https?$/, error: 'must be an http(s) URL' })
      .optional(),
    STORAGE_S3_FORCE_PATH_STYLE: z.stringbool().default(false),
    STORAGE_S3_ACCESS_KEY_ID: z.string().trim().min(1).optional(),
    STORAGE_S3_SECRET_ACCESS_KEY: z.string().trim().min(1).optional(),
    // SigV4 signed URLs are valid for at most 7 days.
    STORAGE_S3_URL_EXPIRES_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .max(7 * 24 * 60 * 60)
      .default(12 * 60 * 60),
    PDF_BROWSER_EXECUTABLE_PATH: z.string().trim().min(1).optional(),
    PDF_BROWSER_NO_SANDBOX: z.stringbool().default(false),
    PDF_RENDER_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    PDF_MAX_CONCURRENT_RENDERS: z.coerce.number().int().min(1).max(16).default(2),
    WHATSAPP_PROVIDER: z.enum(WHATSAPP_PROVIDERS).default('disabled'),
    WHATSAPP_ACCESS_TOKEN: z.string().trim().min(1).optional(),
    WHATSAPP_PHONE_NUMBER_ID: z
      .string()
      .trim()
      .regex(/^\d+$/, 'must be the numeric phone number id from WhatsApp Manager')
      .optional(),
    WHATSAPP_API_VERSION: z
      .string()
      .trim()
      .regex(/^v\d+\.\d+$/, 'must look like v23.0')
      .default('v23.0'),
    WHATSAPP_API_BASE_URL: z
      .url({ protocol: /^https$/, error: 'must be an https URL' })
      .default('https://graph.facebook.com'),
    WHATSAPP_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
    WHATSAPP_INVOICE_TEMPLATE_NAME: z
      .string()
      .trim()
      .regex(/^[a-z0-9_]+$/, 'must be a WhatsApp template name (lowercase, digits, underscores)')
      .optional(),
    WHATSAPP_INVOICE_TEMPLATE_LANGUAGE: z.string().trim().min(2).default('en'),
    WHATSAPP_APP_SECRET: z.string().trim().min(1).optional(),
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: z
      .string()
      .trim()
      .min(16, 'must be at least 16 characters')
      .optional(),
    // Set by npm when the API is started through an npm script.
    npm_package_version: z.string().default('0.0.0'),
    // Set to "1" by Vercel in builds and serverless functions.
    VERCEL: z.stringbool().default(false),
  })
  .refine((data) => !data.VERCEL || data.STORAGE_DRIVER !== 'local', {
    path: ['STORAGE_DRIVER'],
    message: 'cannot be "local" on Vercel (no persistent disk); use "s3"',
  })
  .refine(
    (data) =>
      data.STORAGE_DRIVER !== 's3' ||
      (data.STORAGE_S3_BUCKET &&
        data.STORAGE_S3_ACCESS_KEY_ID &&
        data.STORAGE_S3_SECRET_ACCESS_KEY),
    {
      path: ['STORAGE_S3_BUCKET'],
      message:
        'STORAGE_S3_BUCKET, STORAGE_S3_ACCESS_KEY_ID and STORAGE_S3_SECRET_ACCESS_KEY are required when STORAGE_DRIVER=s3',
    },
  )
  .refine((data) => data.JWT_ACCESS_SECRET !== data.JWT_REFRESH_SECRET, {
    path: ['JWT_REFRESH_SECRET'],
    message: 'must differ from JWT_ACCESS_SECRET',
  })
  .refine((data) => data.WHATSAPP_PROVIDER !== 'meta' || data.WHATSAPP_ACCESS_TOKEN, {
    path: ['WHATSAPP_ACCESS_TOKEN'],
    message: 'is required when WHATSAPP_PROVIDER=meta',
  })
  .refine((data) => data.WHATSAPP_PROVIDER !== 'meta' || data.WHATSAPP_PHONE_NUMBER_ID, {
    path: ['WHATSAPP_PHONE_NUMBER_ID'],
    message: 'is required when WHATSAPP_PROVIDER=meta',
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // The logger depends on this module, so report through the console and exit without a stack trace.
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  isProduction: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  isVercel: data.VERCEL,
  appVersion: data.npm_package_version,
  corsOrigins: data.CORS_ORIGIN,
  // Only read when STORAGE_DRIVER=s3, which the refinement above guarantees is fully configured.
  s3Storage: {
    bucket: data.STORAGE_S3_BUCKET ?? '',
    region: data.STORAGE_S3_REGION,
    endpoint: data.STORAGE_S3_ENDPOINT,
    forcePathStyle: data.STORAGE_S3_FORCE_PATH_STYLE,
    accessKeyId: data.STORAGE_S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: data.STORAGE_S3_SECRET_ACCESS_KEY ?? '',
    urlExpiresInSeconds: data.STORAGE_S3_URL_EXPIRES_SECONDS,
  },
} as const;

export type Env = typeof env;
