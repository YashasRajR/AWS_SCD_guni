export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { dateStyle: 'full' });
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, { timeStyle: 'short' });
}

/** Maps a registration/ticket status string to the shared Badge component's tone. */
export function statusTone(status: string): 'success' | 'warning' | 'neutral' | 'info' | 'error' {
  switch (status) {
    case 'CONFIRMED':
    case 'ISSUED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'WAITLISTED':
      return 'info';
    case 'CANCELLED':
    case 'REJECTED':
    case 'REVOKED':
      return 'error';
    default:
      return 'neutral';
  }
}

/** Groups agenda/timeline items by calendar day (local time) for day-by-day rendering. */
export function groupByDay<T>(items: T[], getStart: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const date = new Date(getStart(item));
    const key = Number.isNaN(date.getTime())
      ? 'TBA'
      : date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}
