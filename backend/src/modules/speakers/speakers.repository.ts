import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { SpeakerRow } from './speakers.types.js';
import type { CreateSpeakerInput, UpdateSpeakerInput } from '@scd/validation';

export const speakersRepository = {
  async listPublished(): Promise<SpeakerRow[]> {
    const { rows } = await getPool().query<SpeakerRow>(
      `SELECT * FROM speakers WHERE status = 'PUBLISHED' ORDER BY display_order, name`,
    );
    return rows;
  },

  async findById(id: string): Promise<SpeakerRow | null> {
    const { rows } = await getPool().query<SpeakerRow>('SELECT * FROM speakers WHERE id = $1', [
      id,
    ]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(page: number, pageSize: number): Promise<{ rows: SpeakerRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<SpeakerRow>(
        'SELECT * FROM speakers ORDER BY display_order, name LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM speakers'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async create(input: CreateSpeakerInput): Promise<SpeakerRow> {
    const { rows } = await getPool().query<SpeakerRow>(
      `INSERT INTO speakers
         (name, designation, organization, bio, profile_image, linkedin_url, website_url, display_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.name,
        input.designation ?? null,
        input.organization ?? null,
        input.bio ?? null,
        input.profileImage ?? null,
        input.linkedinUrl ?? null,
        input.websiteUrl ?? null,
        input.displayOrder ?? 0,
        input.status ?? 'DRAFT',
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateSpeakerInput): Promise<SpeakerRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      name: patch.name,
      designation: patch.designation,
      organization: patch.organization,
      bio: patch.bio,
      profile_image: patch.profileImage,
      linkedin_url: patch.linkedinUrl,
      website_url: patch.websiteUrl,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<SpeakerRow>(
      `UPDATE speakers SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM speakers WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
