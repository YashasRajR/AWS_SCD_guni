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

  /** Payment gateway order/payment id, or the registration it belongs to. */
  async payments(q: string): Promise<SearchResult[]> {
    const { rows } = await getPool().query<{
      id: string;
      provider_payment_id: string | null;
      registration_number: string;
      amount: string;
      status: string;
    }>(
      `SELECT p.id, p.provider_payment_id, r.registration_number, p.amount, p.status
       FROM payments p
       JOIN registrations r ON r.id = p.registration_id
       WHERE p.provider_payment_id ILIKE $1
          OR p.provider_order_id ILIKE $1
          OR r.registration_number ILIKE $1
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [`%${q}%`, LIMIT],
    );
    return rows.map((r) => ({
      type: 'PAYMENT' as const,
      id: r.id,
      title: r.provider_payment_id ?? r.id,
      subtitle: `${r.registration_number} · ${r.amount} · ${r.status}`,
      adminPath: `/payments?search=${encodeURIComponent(r.registration_number)}`,
    }));
  },

  /** Invoice number → the invoice record. */
  async invoices(q: string): Promise<SearchResult[]> {
    const { rows } = await getPool().query<{ id: string; invoice_number: string }>(
      `SELECT id, invoice_number FROM invoices WHERE invoice_number ILIKE $1
       ORDER BY created_at DESC LIMIT $2`,
      [`%${q}%`, LIMIT],
    );
    return rows.map((r) => ({
      type: 'INVOICE' as const,
      id: r.id,
      title: r.invoice_number,
      subtitle: 'Invoice',
      adminPath: `/invoices?search=${encodeURIComponent(r.invoice_number)}`,
    }));
  },
};
