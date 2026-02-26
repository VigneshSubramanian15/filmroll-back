import 'dotenv/config';

const usePgBouncer = process.env.USE_PGBOUNCER === 'true';

export const dbConfig = {
  host: usePgBouncer
    ? process.env.PGBOUNCER_HOST || 'localhost'
    : process.env.POSTGRES_HOST || 'localhost',
  port: usePgBouncer
    ? parseInt(process.env.PGBOUNCER_PORT) || 6432
    : parseInt(process.env.POSTGRES_PORT) || 5432,
  database: process.env.POSTGRES_DB || 'filmroll',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
};

export const authConfig = {
  docsAuthEnabled: process.env.DOCS_AUTH_ENABLED === 'true',
  docsUsername: process.env.DOCS_USERNAME || 'admin',
  docsPassword: process.env.DOCS_PASSWORD || 'changeme',
};
