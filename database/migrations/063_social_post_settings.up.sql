-- Admin-editable settings for "Create My SCD Post" (spec #28): which
-- platforms are enabled, the base hashtags, and a few opening-line
-- variants used to personalize the generated copy. Single row (id = 1) --
-- there's only ever one active configuration, same idea as `event` having
-- one current row, but without the status/list machinery event needs.
CREATE TABLE social_post_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  linkedin_enabled BOOLEAN NOT NULL DEFAULT true,
  instagram_enabled BOOLEAN NOT NULL DEFAULT true,
  base_hashtags TEXT[] NOT NULL DEFAULT ARRAY['#AWSStudentCommunityDay', '#AWSSCD2026', '#AWSCloud'],
  intro_lines TEXT[] NOT NULL DEFAULT ARRAY[
    E'🚀 I''m attending {event}!',
    E'✨ Counting down to {event} -- can''t wait!',
    E'📅 Just registered for {event} and I''m thrilled to be part of it!'
  ],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO social_post_settings (id) VALUES (1);
