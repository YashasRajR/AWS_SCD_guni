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

  PAYMENT_PROVIDER_KEY: z.string().optional().default(''),
  PAYMENT_WEBHOOK_SECRET: z.string().optional().default(''),
  EMAIL_PROVIDER_KEY: z.string().optional().default(''),
  EMAIL_FROM_ADDRESS: z.string().optional().default('noreply@example.com'),
  STORAGE_BUCKET: z.string().optional().default(''),

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
