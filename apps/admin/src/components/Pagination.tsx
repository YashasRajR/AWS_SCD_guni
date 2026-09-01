interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <span className="pagination-info">
        Page {page} of {totalPages} · {totalItems} total
      </span>
      <div className="pagination-buttons">
        <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
