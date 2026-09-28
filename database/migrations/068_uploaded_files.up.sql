-- Uploaded files (speaker photos, etc.) used to live on local disk, but
-- the backend's Render plan has no persistent disk -- every redeploy or
-- restart silently wiped them while the DB still pointed at their URLs.
-- Postgres is the one thing that's actually persistent on the free tier,
-- so small admin-uploaded images are stored here instead.
CREATE TABLE uploaded_files (
  key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
