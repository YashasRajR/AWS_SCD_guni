import { z } from 'zod';
import { loadEnv } from '@scd/config';

// The backend's own env schema — this is the ONLY place that knows about
// secrets (AUTH_SECRET, payment/email provider keys). Never re-export raw
// process.env or these values to a frontend bundle.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_VERSION: z.string().default('v1'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((v) => v === 'true'),

  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters'),
  AUTH_TOKEN_TTL: z.string().default('15m'),
  AUTH_REFRESH_TOKEN_TTL: z.string().default('30d'),
  PASSWORD_RESET_TOKEN_TTL: z.string().default('1h'),
  EMAIL_VERIFICATION_TOKEN_TTL: z.string().default('24h'),

  PUBLIC_APP_URL: z.string().url().default('http://localhost:5173'),
  VOLUNTEER_APP_URL: z.string().url().default('http://localhost:5174'),
  ADMIN_APP_URL: z.string().url().default('http://localhost:5175'),

  // Razorpay-shaped (key id + key secret + webhook secret) — chosen because
  // its test/sandbox mode is free to develop against and it settles in
  // INR, matching the default currency below. Left blank, initiating a
  // payment fails with a clear "not configured" error rather than faking
  // an order — see integrations/payment/unconfigured-provider.ts. Live
  // transaction fees are Razorpay's standard pricing, not "free forever";
  // verify current rates before going live.
  PAYMENT_PROVIDER_KEY: z.string().optional().default(''),
  PAYMENT_PROVIDER_SECRET: z.string().optional().default(''),
  PAYMENT_WEBHOOK_SECRET: z.string().optional().default(''),

  // SMTP is the free/self-hostable choice (works with a Gmail app password,
  // a free-tier relay like Brevo/Mailtrap, or any real mail server) rather
  // than binding to one paid provider's API. Left blank, the backend falls
  // back to logging emails to the console instead of sending them — see
  // integrations/email/console-provider.ts — so local dev never needs real
  // credentials just to exercise the verify/reset-password flow.
  EMAIL_SMTP_HOST: z.string().optional().default(''),
  EMAIL_SMTP_PORT: z.coerce.number().int().positive().optional().default(587),
  EMAIL_SMTP_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  EMAIL_SMTP_USER: z.string().optional().default(''),
  EMAIL_SMTP_PASSWORD: z.string().optional().default(''),
  EMAIL_FROM_ADDRESS: z.string().optional().default('noreply@example.com'),
  EMAIL_FROM_NAME: z.string().optional().default('AWS Student Community Day'),

  STORAGE_BUCKET: z.string().optional().default(''),

  // Local-disk storage adapter for uploaded images (speaker photos, etc.)
  // -- see integrations/storage/local-storage.ts. UPLOAD_DIR is resolved
  // relative to the backend process's cwd; PUBLIC_API_URL is the origin
  // uploaded files are served from, so a stored URL still resolves from
  // apps on other origins (web/volunteer), not just the admin app.
  UPLOAD_DIR: z.string().optional().default('uploads'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Parses and validates process.env once, caching the result. Throws with a
 * readable, itemized message (not a raw stack trace) if anything required
 * is missing — this is the "useful configuration error on startup" the
 * spec asks for.
 */
export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = loadEnv(envSchema);
  }
  return cachedEnv;
}
