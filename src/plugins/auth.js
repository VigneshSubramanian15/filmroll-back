import fp from 'fastify-plugin';
import { authConfig } from '../config/database.js';

async function authPlugin(fastify, options) {
  fastify.decorate('verifyBasicAuth', async function (request, reply) {
    if (!authConfig.docsAuthEnabled) {
      return;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      reply.code(401);
      reply.header('WWW-Authenticate', 'Basic realm="Filmroll API Documentation"');
      return reply.send({
        error: 'Unauthorized',
        message: 'Authentication required to access this resource',
      });
    }

    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      if (username !== authConfig.docsUsername || password !== authConfig.docsPassword) {
        reply.code(401);
        reply.header('WWW-Authenticate', 'Basic realm="Filmroll API Documentation"');
        return reply.send({
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }

      request.user = { username };
    } catch (err) {
      fastify.log.error('Authentication error:', err);
      reply.code(401);
      reply.header('WWW-Authenticate', 'Basic realm="Filmroll API Documentation"');
      return reply.send({
        error: 'Unauthorized',
        message: 'Invalid authentication format',
      });
    }
  });
}

export default fp(authPlugin);
