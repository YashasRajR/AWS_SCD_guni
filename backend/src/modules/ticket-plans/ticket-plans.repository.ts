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
      `INSERT INTO ticket_plans (code, name, description, price, currency, is_active, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        input.code,
        input.name,
        input.description ?? null,
        input.price ?? 0,
        input.currency ?? 'INR',
        input.isActive ?? true,
        input.displayOrder ?? 0,
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
