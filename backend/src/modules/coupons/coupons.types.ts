import type { Coupon } from '@scd/types';

export interface CouponRow {
  id: string;
  code: string;
  name: string | null;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: string;
  currency: string;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  per_user_limit: number;
  ticket_plan_id: string | null;
  min_order_amount: string | null;
  max_discount_amount: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function toCoupon(row: CouponRow): Coupon {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    currency: row.currency,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxUses: row.max_uses,
    perUserLimit: row.per_user_limit,
    ticketPlanId: row.ticket_plan_id,
    minOrderAmount: row.min_order_amount,
    maxDiscountAmount: row.max_discount_amount,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
