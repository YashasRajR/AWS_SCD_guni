-- One row per redemption, used both to enforce max_uses/per_user_limit
-- (via COUNT queries -- see coupons.service.ts) and as an audit trail of
-- what discount each registration actually received.
CREATE TABLE coupon_usages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id        UUID NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
  attendee_id      UUID NOT NULL REFERENCES attendees (id) ON DELETE CASCADE,
  registration_id  UUID NOT NULL REFERENCES registrations (id) ON DELETE CASCADE,
  discount_amount  NUMERIC(10, 2) NOT NULL,
  used_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX coupon_usages_coupon_id_idx ON coupon_usages (coupon_id);
CREATE INDEX coupon_usages_attendee_id_idx ON coupon_usages (attendee_id);
-- One redemption per registration -- a registration can't be double-billed
-- against the same coupon by a retried request.
CREATE UNIQUE INDEX coupon_usages_registration_id_unique ON coupon_usages (registration_id);
