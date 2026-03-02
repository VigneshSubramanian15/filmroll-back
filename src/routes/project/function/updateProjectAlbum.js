import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function updateProjectAlbumHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { albumId, projectId, name, photo_selection_count } = request.body;

  if (!albumId || !projectId) {
    return fail(reply, 400, 'Bad Request', 'albumId and projectId are required');
  }

  if (name === undefined && photo_selection_count === undefined) {
    return fail(reply, 400, 'Bad Request', 'At least one field must be provided to update');
  }

  const clientDb = await fastify.pg.connect();
  try {
    // 1. Verify project exists and belongs to this studio
    const { rows: projectRows } = await clientDb.query(
      'SELECT id FROM projects WHERE id = $1 AND studio_id = $2',
      [projectId, user.studioId],
    );

    if (projectRows.length === 0) {
      return fail(reply, 404, 'Not found', 'Project not found or does not belong to your studio');
    }

    // 2. Build dynamic update query
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (photo_selection_count !== undefined) {
      fieldsToUpdate.push(`photo_selection_count = $${paramIndex++}`);
      values.push(photo_selection_count);
    }

    if (fieldsToUpdate.length === 0) {
      return fail(reply, 400, 'Bad Request', 'No valid fields provided to update');
    }

    values.push(albumId, projectId);

    const { rows } = await clientDb.query(
      `UPDATE project_albums
       SET ${fieldsToUpdate.join(', ')}
       WHERE id = $${paramIndex} AND project_id = $${paramIndex + 1}
       RETURNING id, name, photo_selection_count`,
      values,
    );

    if (rows.length === 0) {
      return fail(reply, 404, 'Not found', 'Album not found in this project');
    }

    return ok(reply, { album: rows[0] }, 'Album updated successfully');
  } catch (err) {
    fastify.log.error({ err }, 'Update project album error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    clientDb.release();
  }
}
