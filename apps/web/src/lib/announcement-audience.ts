import type { Announcement } from '@scd/types';

/** Filters the shared /announcements list by targetAudience against the
 * viewer's own auth status -- this is a public, unauthenticated endpoint,
 * so "audience" can only ever be "everyone" vs "signed in" vs "not signed
 * in", never a real role/segment. Used by both the top banner and the
 * popup so they stay in sync. 'checking' (auth not yet resolved) shows
 * only ALL-audience announcements to avoid a flash of the wrong one. */
export function filterByAudience(
  items: Announcement[],
  authStatus: 'checking' | 'signed-out' | 'signed-in',
): Announcement[] {
  return items.filter((a) => {
    if (a.targetAudience === 'ALL') return true;
    if (a.targetAudience === 'ATTENDEE') return authStatus === 'signed-in';
    if (a.targetAudience === 'GUEST') return authStatus === 'signed-out';
    return true;
  });
}
