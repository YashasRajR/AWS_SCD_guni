export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'PUBLISHED' || status === 'ACTIVE' || status === 'CONFIRMED' || status === 'COMPLETED'
      ? 'badge-green'
      : status === 'DRAFT' || status === 'PENDING' || status === 'WAITLISTED'
        ? 'badge-amber'
        : status === 'ARCHIVED' ||
            status === 'CANCELLED' ||
            status === 'REJECTED' ||
            status === 'REVOKED' ||
            status === 'INACTIVE'
          ? 'badge-gray'
          : 'badge-blue';
  return <span className={`badge ${tone}`}>{status}</span>;
}
