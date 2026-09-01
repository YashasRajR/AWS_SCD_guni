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
