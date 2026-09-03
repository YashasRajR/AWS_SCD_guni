/**
 * Builds a `col = $n, ...` SET fragment (and the matching values array) for
 * a partial UPDATE from a { column: value } map, skipping any key whose
 * value is `undefined` — that's how repositories distinguish "field not
 * included in this patch" from "field explicitly cleared" (pass `null` for
 * the latter, on nullable columns). Column names always come from a fixed,
 * hardcoded map written in each repository, never from user input, so
 * building SQL by string concatenation here stays injection-safe: only the
 * *values* are ever parameterized user data.
 */
export function buildUpdateSet(
  columns: Record<string, unknown>,
  startIndex = 1,
): { setClause: string; values: unknown[]; nextIndex: number } {
  const setParts: string[] = [];
  const values: unknown[] = [];
  let i = startIndex;
  for (const [col, val] of Object.entries(columns)) {
    if (val === undefined) continue;
    setParts.push(`${col} = $${i}`);
    values.push(val);
    i++;
  }
  return { setClause: setParts.join(', '), values, nextIndex: i };
}

export interface ListQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedListOptions {
  /** Table to query — always a fixed, hardcoded string per call site, never user input. */
  table: string;
  /** Columns ILIKE'd (OR'd together) against `search`, if provided. Fixed, hardcoded per call site. */
  searchColumns?: string[];
  /** Whitelist mapping a public `sortBy` value to its real column — the only way user input can
   * reach an ORDER BY, so an unrecognized `sortBy` falls back to `defaultOrderBy` rather than
   * ever being concatenated directly. */
  sortableColumns?: Record<string, string>;
  /** Raw ORDER BY fragment used when no valid `sortBy` is given — a fixed, hardcoded string. */
  defaultOrderBy: string;
  /** Optional fixed WHERE fragment (e.g. `status = 'PUBLISHED'`) — fixed, hardcoded per call site, never user input. */
  where?: string;
}

/**
 * Shared admin list-endpoint query builder: pagination + an optional
 * case-insensitive substring search across a fixed set of columns +
 * optional sort by a whitelisted column. Used by every admin
 * content-management list endpoint (speakers, sessions, agenda, timeline,
 * venues, faqs, announcements, events) so search/filter/sort behavior is
 * consistent across all of them rather than each module reinventing it.
 *
 * Every SQL fragment (table, column names, ORDER BY) is always a fixed,
 * hardcoded string supplied by the call site — never derived from request
 * input. The only place caller-influenced state enters the query is as a
 * bound parameter ($1, $2, ...): the search term, and — for sort — the
 * *choice* of which whitelisted column to use, looked up from
 * `sortableColumns` rather than interpolated directly.
 */
export async function paginatedListQuery<T>(
  db: { query: <R>(text: string, values?: unknown[]) => Promise<{ rows: R[] }> },
  opts: PaginatedListOptions,
  params: ListQueryParams,
): Promise<{ rows: T[]; total: number }> {
  const { table, searchColumns = [], sortableColumns = {}, defaultOrderBy, where } = opts;
  const { page, pageSize, search, sortBy, sortOrder } = params;

  const conditions: string[] = [];
  const values: unknown[] = [];
  if (where) conditions.push(where);
  if (search && search.trim() && searchColumns.length > 0) {
    values.push(`%${search.trim()}%`);
    const idx = values.length;
    conditions.push(`(${searchColumns.map((col) => `${col} ILIKE $${idx}`).join(' OR ')})`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sortColumn = sortBy ? sortableColumns[sortBy] : undefined;
  const orderClause = sortColumn ? `${sortColumn} ${sortOrder === 'desc' ? 'DESC' : 'ASC'}` : defaultOrderBy;

  const offset = (page - 1) * pageSize;
  const limitIdx = values.length + 1;
  const offsetIdx = values.length + 2;

  const [{ rows }, countResult] = await Promise.all([
    db.query<T>(
      `SELECT * FROM ${table} ${whereClause} ORDER BY ${orderClause} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      [...values, pageSize, offset],
    ),
    db.query<{ count: string }>(`SELECT count(*) FROM ${table} ${whereClause}`, values),
  ]);
  return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
}
