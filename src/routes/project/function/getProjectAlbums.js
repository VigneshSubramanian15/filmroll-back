import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function getProjectAlbumsHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { projectId } = request.query;

  const client = await fastify.pg.connect();
  try {
    // Keep it secure, check if project belongs to studio
    const { rows: projectRows } = await client.query(
      'SELECT id FROM projects WHERE id = $1 AND studio_id = $2',
      [projectId, user.studioId],
    );

    if (projectRows.length === 0) {
      return fail(reply, 404, 'Not found', 'Project not found or does not belong to your studio');
    }

    const { rows } = await client.query(
      `SELECT id, name, photo_selection_count
       FROM project_albums
       WHERE project_id = $1
       ORDER BY created_at ASC`,
      [projectId],
    );

    return ok(reply, { albums: rows }, 'Project albums fetched successfully');
  } catch (err) {
    fastify.log.error({ err }, 'Get project albums error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
