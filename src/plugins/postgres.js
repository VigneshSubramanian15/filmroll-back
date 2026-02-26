import fp from 'fastify-plugin';
import postgres from '@fastify/postgres';
import { dbConfig } from '../config/database.js';

async function postgresConnector(fastify, options) {
  await fastify.register(postgres, {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    min: dbConfig.min,
    max: dbConfig.max,
    connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
    idleTimeoutMillis: dbConfig.idleTimeoutMillis,
  });

  try {
    const client = await fastify.pg.connect();
    const connectionType = process.env.USE_PGBOUNCER === 'true' ? 'PGBouncer' : 'PostgreSQL';
    fastify.log.info(
      `${connectionType} connected successfully (Pool: ${dbConfig.min}-${dbConfig.max})`,
    );
    client.release();
  } catch (err) {
    fastify.log.error('Database connection failed:', err);
    throw err;
  }
}

export default fp(postgresConnector);
