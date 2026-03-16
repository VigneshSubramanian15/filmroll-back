import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import scalarFastifyApiReference from '@scalar/fastify-api-reference';
import postgresPlugin from './plugins/postgres.js';
import authPlugin from './plugins/auth.js';
import routes from './routes/index.js';
import { maxFileSize } from './config/r2.js';

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  await fastify.register(authPlugin);

  await fastify.register(multipart, {
    limits: {
      fileSize: maxFileSize,
    },
  });

  await fastify.register(postgresPlugin);

  await fastify.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'Filmroll API',
        description: 'Filmroll API Documentation',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'General', description: 'General endpoints' },
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Photos', description: 'Photo management endpoints' },
        { name: 'User', description: 'Authentication & user registration' },
        { name: 'Studio', description: 'Studio management' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from /user-verify or /user-set-password',
          },
        },
      },
    },
  });

  await fastify.register(scalarFastifyApiReference, {
    routePrefix: '/docs',
    configuration: {
      theme: 'purple',
      metaData: {
        title: 'Filmroll API Documentation',
        description: 'Interactive API documentation for Filmroll',
      },
    },
    hooks: {
      onRequest: [fastify.verifyBasicAuth],
    },
  });

  await fastify.register(routes);

  return fastify;
}

async function start() {
  try {
    const app = await buildApp();

    process.on('uncaughtException', (err) => {
      app.log.error({ err }, 'Uncaught exception');
      if (err.code === 'EPIPE' || err.code === 'ECONNRESET') return;
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      app.log.error({ err: reason }, 'Unhandled rejection');
    });

    await app.listen({ port: PORT, host: HOST });

    console.log('');
    console.log('🎬 Filmroll API Server Started!');
    console.log('================================');
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(
      `📚 API Docs: http://localhost:${PORT}/docs ${process.env.DOCS_AUTH_ENABLED === 'true' ? '🔒 (Protected)' : ''}`,
    );
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    if (process.env.DOCS_AUTH_ENABLED === 'true') {
      console.log(`🔑 Docs Auth: Username: ${process.env.DOCS_USERNAME}`);
    }
    if (process.env.USE_PGBOUNCER === 'true') {
      console.log(`🔌 Using PGBouncer on port ${process.env.PGBOUNCER_PORT}`);
    }
    console.log('================================');
    console.log('');
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

start();
