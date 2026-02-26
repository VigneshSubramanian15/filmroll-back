-- ============================================================
-- studios
-- ============================================================
CREATE TABLE IF NOT EXISTS studios (
    id              SERIAL      PRIMARY KEY,
    studio_name     TEXT        NOT NULL UNIQUE,
    website_url     TEXT,
    city            TEXT,
    country         TEXT,
    address         TEXT,
    logo_url        TEXT,
    expires_on      TIMESTAMPTZ             DEFAULT NULL,
    plan_id         INT         REFERENCES plans (id) ON DELETE SET NULL,
    modules         TEXT[]      NOT NULL DEFAULT '{}',
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    is_suspended    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_studios_updated_at
    BEFORE UPDATE ON studios
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Auto Populate plan_id and modules based on Basic Plan if not provided
CREATE OR REPLACE FUNCTION set_studio_defaults()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id  INT;
    v_modules  TEXT[];
BEGIN
    IF NEW.plan_id IS NULL THEN
        SELECT id INTO v_plan_id
        FROM   plans
        WHERE  name = 'Basic Plan'
        LIMIT  1;

        NEW.plan_id := v_plan_id;
    END IF;

    IF NEW.modules IS NULL OR array_length(NEW.modules, 1) IS NULL THEN
        SELECT ARRAY_AGG(m.key ORDER BY m.key)
        INTO   v_modules
        FROM   plans  p
        JOIN   modules m ON m.id = p.modules
        WHERE  p.id = NEW.plan_id;

        NEW.modules := COALESCE(v_modules, '{}');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_studio_defaults
    BEFORE INSERT ON studios
    FOR EACH ROW EXECUTE FUNCTION set_studio_defaults();
