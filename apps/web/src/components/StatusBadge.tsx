const TONE_BY_STATUS: Record<string, 'green' | 'amber' | 'gray' | 'blue' | 'red'> = {
  PUBLISHED: 'green',
  CONFIRMED: 'green',
  ISSUED: 'green',
  ACTIVE: 'green',
  PENDING: 'amber',
  WAITLISTED: 'amber',
  DRAFT: 'gray',
  ARCHIVED: 'gray',
  INACTIVE: 'gray',
  CANCELLED: 'red',
  REJECTED: 'red',
  REVOKED: 'red',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_BY_STATUS[status] ?? 'gray';
  return <span className={`badge badge-${tone}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}
