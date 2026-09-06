-- Hero/header/footer/contact content for the single event row (same
-- singleton-config pattern as registration_fee/currency in migration 031)
-- so the public site's chrome becomes admin-editable instead of hard-coded.
ALTER TABLE events ADD COLUMN hero_subtitle TEXT;
ALTER TABLE events ADD COLUMN hero_background_image TEXT;
ALTER TABLE events ADD COLUMN primary_cta_label TEXT;
ALTER TABLE events ADD COLUMN primary_cta_url TEXT;
ALTER TABLE events ADD COLUMN secondary_cta_label TEXT;
ALTER TABLE events ADD COLUMN secondary_cta_url TEXT;
ALTER TABLE events ADD COLUMN logo_url TEXT;
ALTER TABLE events ADD COLUMN header_cta_label TEXT;
ALTER TABLE events ADD COLUMN header_cta_url TEXT;
ALTER TABLE events ADD COLUMN header_cta_visible BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN footer_text TEXT;
ALTER TABLE events ADD COLUMN contact_email TEXT;
ALTER TABLE events ADD COLUMN contact_phone TEXT;
