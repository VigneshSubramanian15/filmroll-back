import { uploadImageSchema } from './schema/uploadImage.js';
import { uploadImagesSchema } from './schema/uploadImages.js';
import { uploadImageHandler } from './function/uploadImage.js';
import { uploadImagesHandler } from './function/uploadImages.js';

export default async function uploadRoutes(fastify, options) {
  fastify.post('/upload/image', {
    schema: uploadImageSchema,
    handler: uploadImageHandler,
  });

  fastify.post('/upload/images', {
    schema: uploadImagesSchema,
    handler: uploadImagesHandler,
  });
}
