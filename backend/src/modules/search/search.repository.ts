import { getPool } from '../../config/database.js';
import type { SearchResult } from './search.types.js';

const LIMIT = 8;

export const searchRepository = {
  /** Attendee name, email, or registration number → the attendee record. */
  async attendees(q: string): Promise<SearchResult[]> {
    const { rows } = await getPool().query<{ id: string; full_name: string; email: string }>(
      `SELECT a.id, a.full_name, u.email FROM attendees a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN registrations r ON r.attendee_id = a.id
       WHERE a.full_name ILIKE $1 OR u.email ILIKE $1 OR r.registration_number ILIKE $1
       GROUP BY a.id, u.email
       ORDER BY a.full_name
       LIMIT $2`,
      [`%${q}%`, LIMIT],
    );
    return rows.map((r) => ({
      type: 'ATTENDEE' as const,
      id: r.id,
      title: r.full_name,
      subtitle: r.email,
      adminPath: `/attendees?search=${encodeURIComponent(r.full_name)}`,
    }));
  },

  /** Registration number → the registration record. */
  async registrations(q: string): Promise<SearchResult[]> {
    const { rows } = await getPool().query<{
      id: string;
      registration_number: string;
      full_name: string;
      status: string;
    }>(
      `SELECT r.id, r.registration_number, a.full_name, r.status
       FROM registrations r
       JOIN attendees a ON a.id = r.attendee_id
       WHERE r.registration_number ILIKE $1
       ORDER BY r.created_at DESC
       LIMIT $2`,
      [`%${q}%`, LIMIT],
    );
    return rows.map((r) => ({
      type: 'REGISTRATION' as const,
      id: r.id,
      title: r.registration_number,
      subtitle: `${r.full_name} · ${r.status}`,
      adminPath: `/registrations?search=${encodeURIComponent(r.registration_number)}`,
    }));
  },

};
