import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { TicketPlanRow } from './ticket-plans.types.js';
import type { CreateTicketPlanInput, UpdateTicketPlanInput } from '@scd/validation';

export const ticketPlansRepository = {
  async listActive(): Promise<TicketPlanRow[]> {
    const { rows } = await getPool().query<TicketPlanRow>(
      `SELECT * FROM ticket_plans WHERE is_active = TRUE ORDER BY display_order, name`,
    );
    return rows;
  },

  /**
   * Live count of non-cancelled/non-rejected registrations per plan --
   * never a stored/decrementing counter, so it can't drift out of sync.
   * Keyed by ticket_plan_id; a plan with zero such registrations is
   * simply absent from the result.
   */
  async soldCounts(): Promise<Record<string, number>> {
    const { rows } = await getPool().query<{ ticket_plan_id: string; count: string }>(
      `SELECT ticket_plan_id, COUNT(*) AS count
       FROM registrations
       WHERE ticket_plan_id IS NOT NULL AND status NOT IN ('CANCELLED', 'REJECTED')
       GROUP BY ticket_plan_id`,
    );
    return Object.fromEntries(rows.map((r) => [r.ticket_plan_id, Number(r.count)]));
  },

  async findById(id: string): Promise<TicketPlanRow | null> {
    const { rows } = await getPool().query<TicketPlanRow>('SELECT * FROM ticket_plans WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  async findByCode(code: string): Promise<TicketPlanRow | null> {
    const { rows } = await getPool().query<TicketPlanRow>('SELECT * FROM ticket_plans WHERE code = $1', [code]);
    return rows[0] ?? null;
  },

  /** Admin listing -- active and inactive plans alike. */
  async list(params: ListQueryParams): Promise<{ rows: TicketPlanRow[]; total: number }> {
    return paginatedListQuery<TicketPlanRow>(
      getPool(),
      {
        table: 'ticket_plans',
        searchColumns: ['code', 'name', 'description'],
        sortableColumns: { name: 'name', displayOrder: 'display_order', price: 'price' },
        defaultOrderBy: 'display_order, name',
      },
      params,
    );
  },

  async create(input: CreateTicketPlanInput): Promise<TicketPlanRow> {
    const { rows } = await getPool().query<TicketPlanRow>(
      `INSERT INTO ticket_plans (code, name, description, price, currency, is_active, display_order, benefits, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.code,
        input.name,
        input.description ?? null,
        input.price ?? 0,
        input.currency ?? 'INR',
        input.isActive ?? true,
        input.displayOrder ?? 0,
        input.benefits ?? [],
        input.capacity ?? null,
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateTicketPlanInput): Promise<TicketPlanRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      code: patch.code,
      name: patch.name,
      description: patch.description,
      price: patch.price,
      currency: patch.currency,
      is_active: patch.isActive,
      display_order: patch.displayOrder,
      benefits: patch.benefits,
      capacity: patch.capacity,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<TicketPlanRow>(
      `UPDATE ticket_plans SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM ticket_plans WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
