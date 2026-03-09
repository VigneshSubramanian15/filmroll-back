import { uploadTempImageSchema } from './schema/uploadImage.js';
import { uploadTempImagesSchema } from './schema/uploadImages.js';
import { uploadAlbumImagesSchema } from './schema/uploadAlbumImages.js';
import { uploadTempImageHandler } from './function/uploadImage.js';
import { uploadTempImagesHandler } from './function/uploadImages.js';
import { uploadAlbumImagesHandler } from './function/uploadAlbumImages.js';

export default async function uploadRoutes(fastify, options) {
  fastify.post('/upload/temp-image', {
    schema: uploadTempImageSchema,
    handler: uploadTempImageHandler,
  });

  fastify.post('/upload/temp-images', {
    schema: uploadTempImagesSchema,
    handler: uploadTempImagesHandler,
  });

  fastify.post('/upload/upload-album-images', {
    schema: uploadAlbumImagesSchema,
    handler: uploadAlbumImagesHandler,
  });
}
