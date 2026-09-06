import { getPool } from '../../config/database.js';
import type { SchedulePdfRow } from './schedule-pdf.types.js';

// Singleton row (id fixed at 1) -- there is exactly one schedule PDF for
// the current event, same reasoning as the events table before multi-event
// support exists.
export const schedulePdfRepository = {
  async get(): Promise<SchedulePdfRow | null> {
    const { rows } = await getPool().query<SchedulePdfRow>(
      'SELECT * FROM schedule_pdf WHERE id = 1',
    );
    return rows[0] ?? null;
  },

  async getPdfData(): Promise<{ pdf_data: Buffer | null; published: boolean } | null> {
    const { rows } = await getPool().query<{ pdf_data: Buffer | null; published: boolean }>(
      'SELECT pdf_data, published FROM schedule_pdf WHERE id = 1',
    );
    return rows[0] ?? null;
  },

  async save(pdf: Buffer, isManual: boolean): Promise<SchedulePdfRow> {
    const { rows } = await getPool().query<SchedulePdfRow>(
      `INSERT INTO schedule_pdf (id, pdf_data, is_manual, generated_at, published)
       VALUES (1, $1, $2, now(), COALESCE((SELECT published FROM schedule_pdf WHERE id = 1), false))
       ON CONFLICT (id) DO UPDATE SET pdf_data = $1, is_manual = $2, generated_at = now()
       RETURNING *`,
      [pdf, isManual],
    );
    return rows[0]!;
  },

  async setPublished(published: boolean): Promise<SchedulePdfRow | null> {
    const { rows } = await getPool().query<SchedulePdfRow>(
      'UPDATE schedule_pdf SET published = $1 WHERE id = 1 RETURNING *',
      [published],
    );
    return rows[0] ?? null;
  },
};
