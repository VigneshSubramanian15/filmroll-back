DO $$ BEGIN
    CREATE TYPE user_skill AS ENUM ('Photography', 'Videography', 'Editor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE access_limit AS ENUM ('READ', 'WRITE', 'FULLACCESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL      PRIMARY KEY,
    name            TEXT,
    password        TEXT,
    email           TEXT        NOT NULL UNIQUE,
    phone_number    BIGINT,
    phone_number_code BIGINT,
    phone_number_verified    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_whatsapp     BOOLEAN     NOT NULL DEFAULT FALSE,
    is_suspended    BOOLEAN     NOT NULL DEFAULT FALSE,
    google_id       TEXT        UNIQUE,
    auth_provider   TEXT        NOT NULL DEFAULT 'local',
    last_login      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_number     ON users (phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_google_id  ON users (google_id) WHERE google_id IS NOT NULL;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- user_studios  (user <-> studio  many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_studios (
    id          SERIAL      PRIMARY KEY,
    user_id     INT         NOT NULL REFERENCES users   (id) ON DELETE CASCADE,
    studio_id   INT         NOT NULL REFERENCES studios (id) ON DELETE CASCADE,
    -- e.g. [{"module": "billing", "limit": "READ"}, {"module": "reports", "limit": "FULLACCESS"}]
    access          JSONB       NOT NULL DEFAULT '[]',
    type            TEXT        NOT NULL,  -- e.g. 'owner', 'collaborator', 'viewer'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, studio_id)
);

CREATE INDEX IF NOT EXISTS idx_user_studios_user_id   ON user_studios (user_id);
CREATE INDEX IF NOT EXISTS idx_user_studios_studio_id ON user_studios (studio_id);
CREATE INDEX IF NOT EXISTS idx_user_studios_access     ON user_studios USING GIN (access);
