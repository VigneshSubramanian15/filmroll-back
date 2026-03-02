-- ============================================================
-- photos
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
    id                  SERIAL      PRIMARY KEY,
    name                TEXT,
    key                 TEXT        NOT NULL UNIQUE,
    studio_id           INT         NOT NULL REFERENCES studios (id) ON DELETE CASCADE,
    project_id          INT         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    size                INT,
    compressed_key      TEXT        NOT NULL UNIQUE,
    compressed_size     INT,
    sequence_id         INT,
    is_favourite        BOOLEAN     NOT NULL DEFAULT FALSE,
    is_hidden           BOOLEAN     NOT NULL DEFAULT FALSE,
    tags                TEXT[]      NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_studio_id   ON photos (studio_id);
CREATE INDEX IF NOT EXISTS idx_photos_project_id  ON photos (project_id);
CREATE INDEX IF NOT EXISTS idx_photos_key         ON photos (key);

CREATE OR REPLACE TRIGGER trg_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
