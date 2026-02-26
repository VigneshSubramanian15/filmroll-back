export default async function healthRoutes(fastify, options) {
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            database: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      let dbStatus = 'disconnected';

      try {
        const client = await fastify.pg.connect();
        await client.query('SELECT 1');
        client.release();
        dbStatus = 'connected';
      } catch (err) {
        fastify.log.error('Database health check failed:', err);
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
      };
    },
  });
}
