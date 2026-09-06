import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  /** Free-text search — each admin list endpoint decides which of its own
   * columns this matches against (see backend/src/utils/sql.ts's
   * paginatedListQuery). Optional and ignored by endpoints that don't
   * support search. */
  search: z.string().trim().min(1).max(200).optional(),
  /** Which column to sort by — each endpoint whitelists its own accepted
   * values server-side; an unrecognized one is ignored (falls back to that
   * endpoint's default order) rather than erroring. */
  sortBy: z.string().trim().min(1).max(100).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

// --- Admin: regenerate a ticket/invoice PDF (spec #62) --------------------
// A reason is mandatory -- the whole point of version history is knowing
// why a document changed, not just that it did.
export const regenerateDocumentSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});
export type RegenerateDocumentInput = z.infer<typeof regenerateDocumentSchema>;

// --- Admin: fetch one archived document version (spec #62) ----------------
export const idVersionParamSchema = z.object({
  id: z.string().uuid(),
  version: z.coerce.number().int().min(1),
});
