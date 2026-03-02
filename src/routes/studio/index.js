import { createStudioSchema } from './schema/createStudio.js';
import { createStudioHandler } from './function/createStudio.js';
import { getStudioSchema } from './schema/getStudio.js';
import { getStudioHandler } from './function/getStudio.js';
import { updateStudioSchema } from './schema/updateStudio.js';
import { updateStudioHandler } from './function/updateStudio.js';

export default async function studioRoutes(fastify) {
  fastify.post('/create-studio', {
    schema: createStudioSchema,
    handler: createStudioHandler,
  });

  fastify.get('/get-studio', {
    schema: getStudioSchema,
    handler: getStudioHandler,
  });

  fastify.patch('/update-studio', {
    schema: updateStudioSchema,
    handler: updateStudioHandler,
  });
}
