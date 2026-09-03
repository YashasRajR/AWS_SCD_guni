-- AUTO-DOCUMENTED FROM database/migrations/036_payment_events.up.sql
-- This file is the current-state reference copy; migrations/*.sql remain
-- the canonical, applied source of truth. Do not hand-edit this file
-- without also adding a new migration.

CREATE TABLE payment_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           TEXT NOT NULL,
  provider_event_id  TEXT NOT NULL,
  event_type         TEXT NOT NULL,
  payment_id         UUID REFERENCES payments (id) ON DELETE SET NULL,
  received_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at       TIMESTAMPTZ,
  processing_status  TEXT NOT NULL DEFAULT 'RECEIVED'
                        CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'ERROR')),
  error_message      TEXT,
  metadata           JSONB
);

CREATE UNIQUE INDEX payment_events_provider_event_unique
  ON payment_events (provider, provider_event_id);
CREATE INDEX payment_events_payment_id_idx ON payment_events (payment_id);
CREATE INDEX payment_events_received_at_idx ON payment_events (received_at);
