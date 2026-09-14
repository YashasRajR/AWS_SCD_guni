import { PERMISSIONS } from '@scd/constants';
import { searchRepository } from './search.repository.js';
import type { SearchResult } from './search.types.js';

/** Each category is only searched if the caller holds its permission —
 * a global search bar must not leak attendee data to a role
 * that can't otherwise see it (e.g. CONTENT_ADMIN). */
export const searchService = {
  async search(query: string, permissions: string[]): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const tasks: Promise<SearchResult[]>[] = [];
    if (permissions.includes(PERMISSIONS.VIEW_ATTENDEE)) tasks.push(searchRepository.attendees(trimmed));
    if (permissions.includes(PERMISSIONS.MANAGE_REGISTRATIONS)) tasks.push(searchRepository.registrations(trimmed));

    const results = await Promise.all(tasks);
    return results.flat();
  },
};
