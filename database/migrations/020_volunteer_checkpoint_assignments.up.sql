CREATE TABLE volunteer_checkpoint_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id  UUID NOT NULL REFERENCES volunteers (id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES checkpoints (id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'REVOKED'))
);

CREATE INDEX vca_volunteer_id_idx ON volunteer_checkpoint_assignments (volunteer_id);
CREATE INDEX vca_checkpoint_id_idx ON volunteer_checkpoint_assignments (checkpoint_id);
-- A volunteer can only have one ACTIVE assignment per checkpoint at a time.
CREATE UNIQUE INDEX vca_active_unique
  ON volunteer_checkpoint_assignments (volunteer_id, checkpoint_id)
  WHERE status = 'ACTIVE';
