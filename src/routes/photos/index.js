import { addFolderSchema } from './schema/addFolder.js';
import { viewPhotosSchema } from './schema/viewPhotos.js';
import { getPhotoCountSchema } from './schema/getPhotoCount.js';
import { uploadTempImageSchema } from './schema/uploadImage.js';
import { uploadTempImagesSchema } from './schema/uploadImages.js';
import { uploadAlbumImagesSchema } from './schema/uploadAlbumImages.js';

import { addFolderHandler } from './function/addFolder.js';
import { viewPhotosHandler } from './function/viewPhotos.js';
import { getPhotoCountHandler } from './function/getPhotoCount.js';
import { uploadTempImageHandler } from './function/uploadImage.js';
import { uploadTempImagesHandler } from './function/uploadImages.js';
import { uploadAlbumImagesHandler } from './function/uploadAlbumImages.js';

export default async function photosRoutes(fastify, options) {
  fastify.post('/photos/add-folder', {
    schema: addFolderSchema,
    handler: addFolderHandler,
  });

  fastify.get('/photos/view-photos', {
    schema: viewPhotosSchema,
    handler: viewPhotosHandler,
  });

  fastify.get('/photos/get-photo-count', {
    schema: getPhotoCountSchema,
    handler: getPhotoCountHandler,
  });

  fastify.post('/photos/temp-image', {
    schema: uploadTempImageSchema,
    handler: uploadTempImageHandler,
  });

  fastify.post('/photos/temp-images', {
    schema: uploadTempImagesSchema,
    handler: uploadTempImagesHandler,
  });

  fastify.post('/photos/upload-album-images', {
    schema: uploadAlbumImagesSchema,
    handler: uploadAlbumImagesHandler,
  });
}
