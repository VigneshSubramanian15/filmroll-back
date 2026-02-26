CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS temp_photos (
    id              SERIAL          PRIMARY KEY,
    label           TEXT            NOT NULL,
    key             TEXT            NOT NULL UNIQUE,
    compressed_key  TEXT            UNIQUE,         -- NULL allowed; Postgres treats each NULL as distinct
    size            BIGINT          NOT NULL,
    compressed_size BIGINT          NOT NULL DEFAULT 0,
    system_id       TEXT            NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temp_photos_label
    ON temp_photos (label);

CREATE INDEX IF NOT EXISTS idx_temp_photos_label_trgm
    ON temp_photos USING GIN (label gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_temp_photos_system_id
    ON temp_photos (system_id);
