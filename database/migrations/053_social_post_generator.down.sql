DROP TABLE IF EXISTS attendee_social_posts;
ALTER TABLE social_shares DROP CONSTRAINT social_shares_content_type_check;
ALTER TABLE social_shares ADD CONSTRAINT social_shares_content_type_check
  CHECK (content_type IN ('CERTIFICATE', 'ACHIEVEMENT', 'EVENT_WRAPPED'));
