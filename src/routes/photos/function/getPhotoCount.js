import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function getPhotoCountHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { projectId, folderId } = request.query;
  const { studioId } = user;

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

    const photoCountQuery = folderId
      ? `SELECT COUNT(*) as total FROM photos WHERE project_id = $1 AND folder_id = $2`
      : `SELECT COUNT(*) as total FROM photos WHERE project_id = $1 AND folder_id IS NULL`;

    const folderCountQuery = folderId
      ? `SELECT COUNT(*) as total FROM project_folders WHERE project_id = $1 AND parent_id = $2`
      : `SELECT COUNT(*) as total FROM project_folders WHERE project_id = $1 AND parent_id IS NULL`;

    const values = folderId ? [projectId, folderId] : [projectId];

    const [photoResult, folderResult] = await Promise.all([
      client.query(photoCountQuery, values),
      client.query(folderCountQuery, values),
    ]);

    return ok(reply, {
      photo_count: parseInt(photoResult.rows[0].total, 10),
      folder_count: parseInt(folderResult.rows[0].total, 10),
    });
  } catch (error) {
    fastify.log.error({ err: error }, 'Error fetching photo and folder count');
    return fail(reply, 500, 'Internal server error', error.message);
  } finally {
    client.release();
  }
}
