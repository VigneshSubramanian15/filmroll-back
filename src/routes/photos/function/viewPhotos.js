import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';
import r2Service from '../../../services/r2.service.js';

export async function viewPhotosHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { projectId, folderId, page = 1, limit = 50 } = request.query;
  const { studioId } = user;
  const offset = (page - 1) * limit;

  const client = await fastify.pg.connect();
  try {
    const { rows: projectRows } = await client.query(
      `SELECT id FROM projects WHERE id = $1 AND studio_id = $2 AND is_deleted = FALSE`,
      [projectId, studioId],
    );

    if (projectRows.length === 0) {
      return fail(
        reply,
        403,
        'Forbidden',
        'Project does not belong to your studio or does not exist',
      );
    }

    if (folderId) {
      const { rows: folderRows } = await client.query(
        `SELECT id FROM project_folders WHERE id = $1 AND project_id = $2`,
        [folderId, projectId],
      );
      if (folderRows.length === 0) {
        return fail(
          reply,
          400,
          'Bad request',
          'Folder does not belong to this project or does not exist',
        );
      }
    }

    // Fetch folders in the current level (no pagination for folders)
    const folderQuery = folderId
      ? `SELECT id, name, parent_id, created_at FROM project_folders WHERE project_id = $1 AND parent_id = $2 ORDER BY name ASC`
      : `SELECT id, name, parent_id, created_at FROM project_folders WHERE project_id = $1 AND parent_id IS NULL ORDER BY name ASC`;

    const folderValues = folderId ? [projectId, folderId] : [projectId];
    const { rows: folders } = await client.query(folderQuery, folderValues);

    // Fetch photos in the current level (with pagination)
    const photoQuery = folderId
      ? `SELECT id, name, key, size, sequence_id, is_favourite, is_hidden 
         FROM photos 
         WHERE project_id = $1 AND folder_id = $2 
         ORDER BY sequence_id ASC 
         LIMIT $3 OFFSET $4`
      : `SELECT id, name, key, size, sequence_id, is_favourite, is_hidden 
         FROM photos 
         WHERE project_id = $1 AND folder_id IS NULL 
         ORDER BY sequence_id ASC 
         LIMIT $2 OFFSET $3`;

    const photoValues = folderId
      ? [projectId, folderId, limit, offset]
      : [projectId, limit, offset];
    const { rows: photos } = await client.query(photoQuery, photoValues);

    // Get signed URLs
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const url = await r2Service.getSignedUrl(photo.key);
        return {
          id: photo.id,
          name: photo.name,
          url,
          size: photo.size,
          sequence_id: photo.sequence_id,
          is_favourite: photo.is_favourite,
          is_hidden: photo.is_hidden,
        };
      }),
    );

    return ok(reply, {
      folders,
      photos: photosWithUrls,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    fastify.log.error({ err: error }, 'Error fetching photos and folders');
    return fail(reply, 500, 'Internal server error', error.message);
  } finally {
    client.release();
  }
}
