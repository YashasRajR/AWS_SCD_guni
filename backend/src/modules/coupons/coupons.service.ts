import type { Coupon, CouponPricing, PaginatedData } from '@scd/types';
import type { CreateCouponInput, UpdateCouponInput } from '@scd/validation';
import { couponsRepository } from './coupons.repository.js';
import { toCoupon } from './coupons.types.js';
import { AppError } from '../../utils/errors.js';
import type { ListQueryParams } from '../../utils/sql.js';

export interface CouponPriceResult extends CouponPricing {
  couponId: string;
}

/**
 * Validates a coupon against a ticket plan + attendee and computes the
 * discount. Pure -- no coupon_usages row is written here. Both the
 * preview endpoint and registrations.service.create() call this (the
 * latter right before inserting the registration row, so a rejected
 * coupon never leaves an orphaned registration behind); create() then
 * calls recordUsage() once the registration id exists.
 *
 * ponytail: the usage-limit checks below are COUNT-then-INSERT, not
 * locked in a transaction, so two simultaneous redemptions of the last
 * unit of a max_uses coupon can both pass this check (a real but narrow
 * race -- coupon_usages_registration_id_unique still stops any single
 * registration from double-redeeming). Upgrade path if this ever
 * matters: wrap the count + recordUsage in one transaction with
 * `SELECT ... FOR UPDATE` on the coupon row.
 */
async function price(
  code: string,
  planPrice: number,
  planCurrency: string,
  ticketPlanId: string,
  attendeeId: string,
): Promise<CouponPriceResult> {
  const row = await couponsRepository.findByCode(code);
  if (!row || !row.is_active) {
    throw AppError.validation('This coupon code is not valid.');
  }

  const now = Date.now();
  if (row.starts_at && new Date(row.starts_at).getTime() > now) {
    throw AppError.validation('This coupon is not active yet.');
  }
  if (row.ends_at && new Date(row.ends_at).getTime() < now) {
    throw AppError.validation('This coupon has expired.');
  }
  if (row.ticket_plan_id && row.ticket_plan_id !== ticketPlanId) {
    throw AppError.validation('This coupon does not apply to the selected ticket type.');
  }
  if (row.min_order_amount && planPrice < Number(row.min_order_amount)) {
    throw AppError.validation(`This coupon requires a minimum order of ${planCurrency} ${row.min_order_amount}.`);
  }
  if (row.max_uses !== null) {
    const totalUses = await couponsRepository.countUses(row.id);
    if (totalUses >= row.max_uses) {
      throw AppError.validation('This coupon has reached its usage limit.');
    }
  }
  const attendeeUses = await couponsRepository.countUsesByAttendee(row.id, attendeeId);
  if (attendeeUses >= row.per_user_limit) {
    throw AppError.validation('You have already used this coupon.');
  }

  const rawDiscount =
    row.discount_type === 'PERCENT' ? (planPrice * Number(row.discount_value)) / 100 : Number(row.discount_value);
  const capped = row.max_discount_amount ? Math.min(rawDiscount, Number(row.max_discount_amount)) : rawDiscount;
  // Never discount past zero, and never past the order amount itself.
  const discountAmount = Math.max(0, Math.min(capped, planPrice));

  return {
    couponId: row.id,
    couponCode: row.code,
    originalAmount: planPrice.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    finalAmount: (planPrice - discountAmount).toFixed(2),
    currency: planCurrency,
  };
}

export const couponsService = {
  price,

  /** Persists a redemption already validated by price(). Called once,
   * right after the registration row it belongs to is inserted. */
  async recordUsage(couponId: string, attendeeId: string, registrationId: string, discountAmount: string): Promise<void> {
    await couponsRepository.recordUsage(couponId, attendeeId, registrationId, discountAmount);
  },

  /** Admin listing -- active and inactive coupons alike. Coupons are never
   * listed publicly (spec: validate server-side, don't hand out the list). */
  async adminList(params: ListQueryParams): Promise<PaginatedData<Coupon>> {
    const { rows, total } = await couponsRepository.list(params);
    return {
      items: rows.map(toCoupon),
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  },

  async create(input: CreateCouponInput): Promise<Coupon> {
    const existing = await couponsRepository.findByCode(input.code);
    if (existing) throw AppError.duplicate('A coupon with this code already exists.');
    return toCoupon(await couponsRepository.create(input));
  },

  async update(id: string, patch: UpdateCouponInput): Promise<Coupon> {
    if (patch.code) {
      const existing = await couponsRepository.findByCode(patch.code);
      if (existing && existing.id !== id) {
        throw AppError.duplicate('A coupon with this code already exists.');
      }
    }
    const row = await couponsRepository.update(id, patch);
    if (!row) throw AppError.notFound('Coupon');
    return toCoupon(row);
  },

  async remove(id: string): Promise<void> {
    const deleted = await couponsRepository.delete(id);
    if (!deleted) throw AppError.notFound('Coupon');
  },
};
