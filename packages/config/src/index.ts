import { z } from 'zod';

/**
 * Generic "parse env vars against a zod schema, fail fast with a readable
 * error" helper. The backend defines its OWN schema (with secrets) in
 * backend/src/config — this package only holds the reusable helper, never
 * actual secret values, so it stays safe to import from frontend code too.
 */
export function loadEnv<S extends z.ZodTypeAny>(
  schema: S,
  source: Record<string, string | undefined> = process.env,
): z.infer<S> {
  const parsed = schema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const API_VERSION_PREFIX = '/api/v1';
