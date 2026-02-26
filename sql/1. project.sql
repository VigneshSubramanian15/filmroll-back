-- ============================================================
-- Enums for Project Tables
-- ============================================================
DO $$ BEGIN
    CREATE TYPE auth_type AS ENUM ('PassCode', 'EmailOTP', 'MobileOTP');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE share_settings AS ENUM ('ViewOnly', 'DownloadFiles', 'DownloadRaw');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL      PRIMARY KEY,
    name            TEXT        NOT NULL,
    description     TEXT,
    cover_image     TEXT,
    project_url     TEXT        UNIQUE,
    studio_id       INT         NOT NULL REFERENCES studios (id) ON DELETE CASCADE,
    passcode        INT,
    is_hidden       BOOLEAN     NOT NULL DEFAULT FALSE,
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    auth_type       auth_type   NOT NULL DEFAULT 'PassCode',
    client_view     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_project_url ON projects (project_url);
CREATE INDEX IF NOT EXISTS idx_projects_studio_id   ON projects (studio_id);

CREATE OR REPLACE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- project_albums
-- ============================================================
CREATE TABLE IF NOT EXISTS project_albums (
    id                      SERIAL      PRIMARY KEY,
    name                    TEXT        NOT NULL,
    photo_selection_count   INT         NOT NULL DEFAULT 0,
    project_id              INT         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_albums_project_id ON project_albums (project_id);

CREATE OR REPLACE TRIGGER trg_project_albums_updated_at
    BEFORE UPDATE ON project_albums
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- project_clients
-- ============================================================
CREATE TABLE IF NOT EXISTS project_clients (
    id              SERIAL          PRIMARY KEY,
    name            TEXT            NOT NULL,
    phone_number    BIGINT,
    email           TEXT,
    project_id      INT             NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    is_whatsapp     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_suspended    BOOLEAN         NOT NULL DEFAULT FALSE,
    share_settings  share_settings  NOT NULL DEFAULT 'ViewOnly',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_clients_project_id ON project_clients (project_id);

CREATE OR REPLACE TRIGGER trg_project_clients_updated_at
    BEFORE UPDATE ON project_clients
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
