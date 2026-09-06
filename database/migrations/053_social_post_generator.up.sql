-- "Create My SCD Post" (spec #28) — the attendee-facing social post
-- generator. `social_shares` already existed as a stub for recording that
-- a share happened (no drafting/generation) for CERTIFICATE/ACHIEVEMENT/
-- EVENT_WRAPPED; this adds SCD_POST as a fourth content type it can log,
-- and a new table for the actual draft (bio/interests/photo, generated
-- LinkedIn/Instagram copy, approval state) that social_shares was never
-- meant to hold.
ALTER TABLE social_shares DROP CONSTRAINT social_shares_content_type_check;
ALTER TABLE social_shares ADD CONSTRAINT social_shares_content_type_check
  CHECK (content_type IN ('CERTIFICATE', 'ACHIEVEMENT', 'EVENT_WRAPPED', 'SCD_POST'));

-- One draft per attendee — generating again overwrites in place (spec's
-- "Regenerate"); approving just stamps approved_at without changing the
-- text, so an edit after approval clears it back to unapproved.
CREATE TABLE attendee_social_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id     UUID NOT NULL UNIQUE REFERENCES attendees (id) ON DELETE CASCADE,
  bio             TEXT NOT NULL,
  interests       TEXT[] NOT NULL DEFAULT '{}',
  photo_url       TEXT,
  linkedin_text   TEXT NOT NULL,
  instagram_text  TEXT NOT NULL,
  hashtags        TEXT[] NOT NULL DEFAULT '{}',
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_attendee_social_posts_updated_at
  BEFORE UPDATE ON attendee_social_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
