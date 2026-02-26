import healthRoutes from './health.js';
import uploadRoutes from './upload.js';
import userRoutes from './users.js';
import studioRoutes from './studio.js';
import projectRoutes from './project.js';

export default async function routes(fastify, options) {
  await fastify.register(healthRoutes);
  await fastify.register(uploadRoutes);
  await fastify.register(userRoutes);
  await fastify.register(studioRoutes);
  await fastify.register(projectRoutes);

  fastify.get('/', {
    schema: {
      description: 'Welcome endpoint',
      tags: ['General'],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            message: { type: 'string' },
            version: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      return {
        message: 'Welcome to Filmroll API',
        version: '1.0.0',
        name: 'Filmroll',
      };
    },
  });
}
