import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { EventRow } from './event.types.js';
import type { CreateEventInput, UpdateEventInput } from '@scd/validation';

export const eventRepository = {
  /**
   * The platform is built to support future editions, but for now there is
   * one current event: the most recently created PUBLISHED one.
   */
  async getCurrent(): Promise<EventRow | null> {
    const { rows } = await getPool().query<EventRow>(
      `SELECT * FROM events WHERE status = 'PUBLISHED' ORDER BY event_date DESC LIMIT 1`,
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<EventRow | null> {
    const { rows } = await getPool().query<EventRow>('SELECT * FROM events WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status, not just PUBLISHED. */
  async list(params: ListQueryParams): Promise<{ rows: EventRow[]; total: number }> {
    return paginatedListQuery<EventRow>(getPool(), {
      table: 'events',
      searchColumns: ['name', 'slug', 'description'],
      sortableColumns: { name: 'name', eventDate: 'event_date', status: 'status' },
      defaultOrderBy: 'event_date DESC',
    }, params);
  },

  async create(input: CreateEventInput): Promise<EventRow> {
    const { rows } = await getPool().query<EventRow>(
      `INSERT INTO events
         (name, slug, description, event_date, start_time, end_time, venue, registration_open, registration_close, status, registration_fee, currency,
          hero_subtitle, hero_background_image, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url,
          logo_url, header_cta_label, header_cta_url, header_cta_visible, footer_text, contact_email, contact_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
       RETURNING *`,
      [
        input.name,
        input.slug,
        input.description ?? null,
        input.eventDate,
        input.startTime ?? null,
        input.endTime ?? null,
        input.venue ?? null,
        input.registrationOpen ?? null,
        input.registrationClose ?? null,
        input.status ?? 'DRAFT',
        input.registrationFee ?? 0,
        input.currency ?? 'INR',
        input.heroSubtitle ?? null,
        input.heroBackgroundImage ?? null,
        input.primaryCtaLabel ?? null,
        input.primaryCtaUrl ?? null,
        input.secondaryCtaLabel ?? null,
        input.secondaryCtaUrl ?? null,
        input.logoUrl ?? null,
        input.headerCtaLabel ?? null,
        input.headerCtaUrl ?? null,
        input.headerCtaVisible ?? false,
        input.footerText ?? null,
        input.contactEmail ?? null,
        input.contactPhone ?? null,
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateEventInput): Promise<EventRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      name: patch.name,
      slug: patch.slug,
      description: patch.description,
      event_date: patch.eventDate,
      start_time: patch.startTime,
      end_time: patch.endTime,
      venue: patch.venue,
      registration_open: patch.registrationOpen,
      registration_close: patch.registrationClose,
      status: patch.status,
      registration_fee: patch.registrationFee,
      currency: patch.currency,
      hero_subtitle: patch.heroSubtitle,
      hero_background_image: patch.heroBackgroundImage,
      primary_cta_label: patch.primaryCtaLabel,
      primary_cta_url: patch.primaryCtaUrl,
      secondary_cta_label: patch.secondaryCtaLabel,
      secondary_cta_url: patch.secondaryCtaUrl,
      logo_url: patch.logoUrl,
      header_cta_label: patch.headerCtaLabel,
      header_cta_url: patch.headerCtaUrl,
      header_cta_visible: patch.headerCtaVisible,
      footer_text: patch.footerText,
      contact_email: patch.contactEmail,
      contact_phone: patch.contactPhone,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<EventRow>(
      `UPDATE events SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM events WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
