import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';
import r2Service from '../../../services/r2.service.js';

export async function getProjectPhotosHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { projectId, page = 1, limit = 10 } = request.query;
  const offset = (page - 1) * limit;

  const client = await fastify.pg.connect();
  try {
    const { rows: projectRows } = await client.query(
      'SELECT id FROM projects WHERE id = $1 AND studio_id = $2',
      [projectId, user.studioId],
    );

    if (projectRows.length === 0) {
      return fail(reply, 404, 'Not found', 'Project not found or does not belong to your studio');
    }

    const { rows: photos } = await client.query(
      `SELECT id, name, key, size, sequence_id, is_favourite, is_hidden 
       FROM photos 
       WHERE project_id = $1 
       ORDER BY sequence_id ASC 
       LIMIT $2 OFFSET $3`,
      [projectId, limit, offset],
    );

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
      photos: photosWithUrls,
      pagination: {
        page,
        limit,
      },
    });
  } catch (error) {
    fastify.log.error({ err: error }, 'Error fetching project photos');
    return fail(reply, 500, 'Internal server error', error.message);
  } finally {
    client.release();
  }
}
