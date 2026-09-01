export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Generates a human-friendly unique-ish code such as REG-2026-4F9K2A.
 * Uniqueness is still enforced at the database level (UNIQUE constraint) —
 * this only needs to be *likely* unique, the DB is the source of truth.
 */
export function generateReferenceCode(prefix: string, year: number = new Date().getFullYear()): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

export function formatDateOnly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
