-- Modules
CREATE TABLE IF NOT EXISTS modules (
    id          SERIAL          PRIMARY KEY,
    label       TEXT            NOT NULL,
    key         TEXT            NOT NULL UNIQUE,
    cost        NUMERIC(12, 2)  NOT NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_key ON modules (key);

-- Auto Update updated_at timestamp on UPDATE
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_modules_updated_at
    BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Seed initial modules
INSERT INTO modules (label, key, cost) VALUES
    ('Photo Sharing', 'photo_sharing', 15000),
    ('CMS',           'cms',           25000)
ON CONFLICT (key) DO NOTHING;
