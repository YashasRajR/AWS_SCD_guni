import type { DiscountType } from './enums.js';

export interface Coupon {
  id: string;
  code: string;
  name: string | null;
  discountType: DiscountType;
  /** Percent (0-100) for PERCENT, or a currency amount for FIXED -- decimal string, see EventConfig.registrationFee. */
  discountValue: string;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  perUserLimit: number;
  ticketPlanId: string | null;
  minOrderAmount: string | null;
  maxDiscountAmount: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Result of pricing a ticket plan against a coupon -- returned by the
 * preview endpoint before redemption, and computed identically (with a
 * lock-in) when the registration is actually created. */
export interface CouponPricing {
  couponCode: string;
  originalAmount: string;
  discountAmount: string;
  finalAmount: string;
  currency: string;
}
