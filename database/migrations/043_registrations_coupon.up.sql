ALTER TABLE registrations ADD COLUMN coupon_id UUID REFERENCES coupons (id);
ALTER TABLE registrations ADD COLUMN discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
