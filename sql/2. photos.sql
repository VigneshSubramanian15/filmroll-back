-- ============================================================
-- project_folders
-- ============================================================
CREATE TABLE IF NOT EXISTS project_folders (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    project_id  INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_id   INT REFERENCES project_folders(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_folders_project_id ON project_folders (project_id);
CREATE INDEX IF NOT EXISTS idx_project_folders_parent_id ON project_folders (parent_id);

CREATE OR REPLACE TRIGGER trg_project_folders_updated_at
    BEFORE UPDATE ON project_folders
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- photos
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
    id                  SERIAL      PRIMARY KEY,
    name                TEXT,
    key                 TEXT        NOT NULL UNIQUE,
    studio_id           INT         NOT NULL REFERENCES studios (id) ON DELETE CASCADE,
    project_id          INT         NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    folder_id           INT         REFERENCES project_folders (id) ON DELETE CASCADE,
    size                INT,
    compressed_key      TEXT        UNIQUE,
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
CREATE INDEX IF NOT EXISTS idx_photos_folder_id   ON photos (folder_id);
CREATE INDEX IF NOT EXISTS idx_photos_key         ON photos (key);

CREATE OR REPLACE TRIGGER trg_photos_updated_at
    BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- storage usage
-- ============================================================
CREATE OR REPLACE VIEW storage_usage AS
SELECT
    s.id                        AS studio_id,
    s.studio_name,
    p.id                        AS project_id,
    p.name                      AS project_name,
    COUNT(ph.id)                AS photo_count,
    COALESCE(SUM(ph.size), 0)              AS total_size,
    COALESCE(SUM(ph.compressed_size), 0)   AS total_compressed_size
FROM studios   s
JOIN projects  p  ON p.studio_id = s.id AND p.is_deleted = FALSE
LEFT JOIN photos ph ON ph.project_id = p.id AND ph.is_hidden = FALSE
WHERE s.is_deleted = FALSE
GROUP BY s.id, s.studio_name, p.id, p.name
ORDER BY s.id, p.id;
