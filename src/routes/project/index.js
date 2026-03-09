import { createProjectSchema } from './schema/createProject.js';
import { addProjectAlbumSchema } from './schema/addProjectAlbum.js';
import { addProjectClientSchema } from './schema/addProjectClient.js';
import { updateProjectSchema } from './schema/updateProject.js';
import { verifyProjectUrlSchema } from './schema/verifyProjectUrl.js';
import { setProjectAuthSchema } from './schema/setProjectAuth.js';
import { getProjectsSchema } from './schema/getProjects.js';
import { getProjectClientsSchema } from './schema/getProjectClients.js';
import { getProjectAlbumsSchema } from './schema/getProjectAlbums.js';
import { updateProjectClientSchema } from './schema/updateProjectClient.js';
import { updateProjectAlbumSchema } from './schema/updateProjectAlbum.js';
import { getProjectPhotosSchema } from './schema/getProjectPhotos.js';
import { getProjectPhotosCountSchema } from './schema/getProjectPhotosCount.js';

import { createProjectHandler } from './function/createProject.js';
import { addProjectAlbumHandler } from './function/addProjectAlbum.js';
import { addProjectClientHandler } from './function/addProjectClient.js';
import { updateProjectHandler } from './function/updateProject.js';
import { verifyProjectUrlHandler } from './function/verifyProjectUrl.js';
import { setProjectAuthHandler } from './function/setProjectAuth.js';
import { getProjectsHandler } from './function/getProjects.js';
import { getProjectClientsHandler } from './function/getProjectClients.js';
import { getProjectAlbumsHandler } from './function/getProjectAlbums.js';
import { updateProjectClientHandler } from './function/updateProjectClient.js';
import { updateProjectAlbumHandler } from './function/updateProjectAlbum.js';
import { getProjectPhotosHandler } from './function/getProjectPhotos.js';
import { getProjectPhotosCountHandler } from './function/getProjectPhotosCount.js';

export default async function projectRoutes(fastify) {
  fastify.post('/create-project', {
    schema: createProjectSchema,
    handler: createProjectHandler,
  });

  fastify.post('/add-project-album', {
    schema: addProjectAlbumSchema,
    handler: addProjectAlbumHandler,
  });

  fastify.post('/add-project-client', {
    schema: addProjectClientSchema,
    handler: addProjectClientHandler,
  });

  fastify.post('/verify-project-url', {
    schema: verifyProjectUrlSchema,
    handler: verifyProjectUrlHandler,
  });

  fastify.patch('/update-project', {
    schema: updateProjectSchema,
    handler: updateProjectHandler,
  });

  fastify.patch('/set-project-auth', {
    schema: setProjectAuthSchema,
    handler: setProjectAuthHandler,
  });

  fastify.get('/get-projects', {
    schema: getProjectsSchema,
    handler: getProjectsHandler,
  });

  fastify.get('/get-project-clients', {
    schema: getProjectClientsSchema,
    handler: getProjectClientsHandler,
  });

  fastify.get('/get-project-albums', {
    schema: getProjectAlbumsSchema,
    handler: getProjectAlbumsHandler,
  });

  fastify.patch('/update-project-client', {
    schema: updateProjectClientSchema,
    handler: updateProjectClientHandler,
  });

  fastify.patch('/update-project-album', {
    schema: updateProjectAlbumSchema,
    handler: updateProjectAlbumHandler,
  });

  fastify.get('/get-photos', {
    schema: getProjectPhotosSchema,
    handler: getProjectPhotosHandler,
  });

  fastify.get('/get-total-count-of-photos', {
    schema: getProjectPhotosCountSchema,
    handler: getProjectPhotosCountHandler,
  });
}
