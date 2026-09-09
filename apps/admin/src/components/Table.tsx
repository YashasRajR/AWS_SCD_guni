import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  width?: string;
  /** When true, the column header is clickable and toggles sorting by this
   * column's `key` — the backend admin list endpoint must recognize `key`
   * as one of its whitelisted sortable columns (see each module's
   * repository.ts `sortableColumns`) or the sort is silently ignored. */
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  /** Renders a leading checkbox column for bulk actions — pass all three
   * together, or omit all three for a plain (non-selectable) table. */
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
}

export function Table<T>({
  columns,
  rows,
  getRowId,
  loading,
  error,
  emptyMessage,
  sortBy,
  sortOrder,
  onSortChange,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: TableProps<T>) {
  const selectable = Boolean(selectedIds && onToggleRow && onToggleAll);
  const colSpan = columns.length + (selectable ? 1 : 0);
  // The checkbox column (when present) and the first data column stay
  // pinned while a wide table scrolls horizontally, so the row's label
  // doesn't disappear off-screen along with it -- the checkbox column is
  // a fixed 2.5rem, so the first data column picks up from there.
  const firstColSticky = { position: 'sticky' as const, left: selectable ? '2.5rem' : 0 };
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {selectable && (
              <th className="table-sticky-cell" style={{ width: '2.5rem', left: 0 }}>
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={rows.length > 0 && rows.every((r) => selectedIds!.has(getRowId(r)))}
                  onChange={(e) => onToggleAll!(e.target.checked)}
                />
              </th>
            )}
            {columns.map((col, i) =>
              col.sortable && onSortChange ? (
                <th
                  key={col.key}
                  className={i === 0 ? 'table-sticky-cell' : undefined}
                  style={{ ...(col.width ? { width: col.width } : undefined), ...(i === 0 ? firstColSticky : undefined) }}
                >
                  <button
                    type="button"
                    className="table-sort-header"
                    onClick={() => onSortChange(col.key)}
                    aria-sort={sortBy === col.key ? (sortOrder === 'desc' ? 'descending' : 'ascending') : 'none'}
                  >
                    {col.label}
                    {sortBy === col.key && <span aria-hidden="true">{sortOrder === 'desc' ? ' ▼' : ' ▲'}</span>}
                  </button>
                </th>
              ) : (
                <th
                  key={col.key}
                  className={i === 0 ? 'table-sticky-cell' : undefined}
                  style={{ ...(col.width ? { width: col.width } : undefined), ...(i === 0 ? firstColSticky : undefined) }}
                >
                  {col.label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="table-status">
                Loading…
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={colSpan} className="table-status table-status-error">
                {error}
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="table-status">
                {emptyMessage ?? 'Nothing here yet.'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowId(row)}>
                {selectable && (
                  <td className="table-sticky-cell" style={{ left: 0 }}>
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selectedIds!.has(getRowId(row))}
                      onChange={() => onToggleRow!(getRowId(row))}
                    />
                  </td>
                )}
                {columns.map((col, i) => (
                  <td key={col.key} className={i === 0 ? 'table-sticky-cell' : undefined} style={i === 0 ? firstColSticky : undefined}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
