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
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {selectable && (
              <th style={{ width: '2.5rem' }}>
                <input
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={rows.length > 0 && rows.every((r) => selectedIds!.has(getRowId(r)))}
                  onChange={(e) => onToggleAll!(e.target.checked)}
                />
              </th>
            )}
            {columns.map((col) =>
              col.sortable && onSortChange ? (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
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
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
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
                  <td>
                    <input
                      type="checkbox"
                      aria-label="Select row"
                      checked={selectedIds!.has(getRowId(row))}
                      onChange={() => onToggleRow!(getRowId(row))}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
