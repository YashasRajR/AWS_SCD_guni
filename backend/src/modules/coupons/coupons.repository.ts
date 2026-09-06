import { getPool } from '../../config/database.js';
import { paginatedListQuery, type ListQueryParams } from '../../utils/sql.js';
import { buildUpdateSet } from '../../utils/sql.js';
import type { CouponRow } from './coupons.types.js';
import type { CreateCouponInput, UpdateCouponInput } from '@scd/validation';

export const couponsRepository = {
  /** Case-insensitive -- attendees will type codes in whatever case they see them. */
  async findByCode(code: string): Promise<CouponRow | null> {
    const { rows } = await getPool().query<CouponRow>('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [
      code,
    ]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<CouponRow | null> {
    const { rows } = await getPool().query<CouponRow>('SELECT * FROM coupons WHERE id = $1', [id]);
    return rows[0] ?? null;
  },

  /** Admin listing -- active and inactive coupons alike. Never exposed publicly. */
  async list(params: ListQueryParams): Promise<{ rows: CouponRow[]; total: number }> {
    return paginatedListQuery<CouponRow>(
      getPool(),
      {
        table: 'coupons',
        searchColumns: ['code', 'name'],
        sortableColumns: { code: 'code', createdAt: 'created_at' },
        defaultOrderBy: 'created_at DESC',
      },
      params,
    );
  },

  async create(input: CreateCouponInput): Promise<CouponRow> {
    const { rows } = await getPool().query<CouponRow>(
      `INSERT INTO coupons
         (code, name, discount_type, discount_value, currency, starts_at, ends_at, max_uses,
          per_user_limit, ticket_plan_id, min_order_amount, max_discount_amount, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        input.code,
        input.name ?? null,
        input.discountType,
        input.discountValue,
        input.currency ?? 'INR',
        input.startsAt ?? null,
        input.endsAt ?? null,
        input.maxUses ?? null,
        input.perUserLimit ?? 1,
        input.ticketPlanId ?? null,
        input.minOrderAmount ?? null,
        input.maxDiscountAmount ?? null,
        input.isActive ?? true,
      ],
    );
    return rows[0]!;
  },

  async update(id: string, patch: UpdateCouponInput): Promise<CouponRow | null> {
    const { setClause, values, nextIndex } = buildUpdateSet({
      code: patch.code,
      name: patch.name,
      discount_type: patch.discountType,
      discount_value: patch.discountValue,
      currency: patch.currency,
      starts_at: patch.startsAt,
      ends_at: patch.endsAt,
      max_uses: patch.maxUses,
      per_user_limit: patch.perUserLimit,
      ticket_plan_id: patch.ticketPlanId,
      min_order_amount: patch.minOrderAmount,
      max_discount_amount: patch.maxDiscountAmount,
      is_active: patch.isActive,
    });
    if (values.length === 0) return this.findById(id);
    values.push(id);
    const { rows } = await getPool().query<CouponRow>(
      `UPDATE coupons SET ${setClause} WHERE id = $${nextIndex} RETURNING *`,
      values,
    );
    return rows[0] ?? null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await getPool().query('DELETE FROM coupons WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async countUses(couponId: string): Promise<number> {
    const { rows } = await getPool().query<{ count: string }>(
      'SELECT count(*) FROM coupon_usages WHERE coupon_id = $1',
      [couponId],
    );
    return Number(rows[0]?.count ?? 0);
  },

  async countUsesByAttendee(couponId: string, attendeeId: string): Promise<number> {
    const { rows } = await getPool().query<{ count: string }>(
      'SELECT count(*) FROM coupon_usages WHERE coupon_id = $1 AND attendee_id = $2',
      [couponId, attendeeId],
    );
    return Number(rows[0]?.count ?? 0);
  },

  /**
   * Records a redemption. registration_id has a unique index (see
   * database/migrations/042_coupon_usages), so a retried registration
   * request can never double-count a redemption for the same coupon.
   */
  async recordUsage(couponId: string, attendeeId: string, registrationId: string, discountAmount: string): Promise<void> {
    await getPool().query(
      `INSERT INTO coupon_usages (coupon_id, attendee_id, registration_id, discount_amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (registration_id) DO NOTHING`,
      [couponId, attendeeId, registrationId, discountAmount],
    );
  },
};
