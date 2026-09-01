import { getPool } from '../../config/database.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { FaqRow } from './faq.types.js';
import type { CreateFaqInput, UpdateFaqInput } from '@scd/validation';

export const faqRepository = {
  async listPublished(): Promise<FaqRow[]> {
    const { rows } = await getPool().query<FaqRow>(
      `SELECT * FROM faqs WHERE status = 'PUBLISHED' ORDER BY category, display_order`,
    );
    return rows;
  },

  async findById(id: string): Promise<FaqRow | null> {
    const { rows } = await getPool().query<FaqRow>('SELECT * FROM faqs WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing — every status. */
  async list(page: number, pageSize: number): Promise<{ rows: FaqRow[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const [{ rows }, countResult] = await Promise.all([
      getPool().query<FaqRow>(
        'SELECT * FROM faqs ORDER BY category, display_order LIMIT $1 OFFSET $2',
        [pageSize, offset],
      ),
      getPool().query<{ count: string }>('SELECT count(*) FROM faqs'),
    ]);
    return { rows, total: Number(countResult.rows[0]?.count ?? 0) };
  },

  async create(input: CreateFaqInput): Promise<FaqRow> {
    const { rows } = await getPool().query<FaqRow>(
      `INSERT INTO faqs (question, answer, category, display_order, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.question, input.answer, input.category ?? null, input.displayOrder ?? 0, input.status ?? 'DRAFT'],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateFaqInput): Promise<FaqRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      question: patch.question,
      answer: patch.answer,
      category: patch.category,
      display_order: patch.displayOrder,
      status: patch.status,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<FaqRow>(
      `UPDATE faqs SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM faqs WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
