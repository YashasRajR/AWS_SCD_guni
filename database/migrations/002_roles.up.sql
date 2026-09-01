CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX roles_name_unique ON roles (name);

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- user_roles: which role(s) a user account holds. Not in the original
-- table list but required to make role-based auth actually work — a user
-- with no row here has no roles and only default (public) access.
CREATE TABLE user_roles (
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_id    UUID NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX user_roles_role_id_idx ON user_roles (role_id);
