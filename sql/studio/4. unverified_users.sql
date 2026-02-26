CREATE TABLE IF NOT EXISTS unverified_users (
    id              SERIAL      PRIMARY KEY,
    email           TEXT        NOT NULL UNIQUE,
    secret_code     BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER trg_unverified_users_updated_at
    BEFORE UPDATE ON unverified_users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();