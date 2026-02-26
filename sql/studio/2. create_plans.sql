DO $$ BEGIN
    CREATE TYPE plan_duration AS ENUM ('Year', 'Month');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS plans (
    id          SERIAL          PRIMARY KEY,
    name        TEXT            NOT NULL,
    cost        NUMERIC(12, 2)  NOT NULL,
    storage     NUMERIC(12, 2)  NOT NULL,   -- in GB
    duration    plan_duration   NOT NULL,
    modules     INT             REFERENCES modules (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_plans_updated_at
    BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


INSERT INTO plans (name, cost, storage, duration, modules)
VALUES ('Basic Plan', 40000, 50, 'Month', (SELECT id FROM modules WHERE key = 'photo_sharing'))
ON CONFLICT DO NOTHING;
