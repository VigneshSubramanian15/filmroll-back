import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function getProjectPhotosCountHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { projectId } = request.query;

  const client = await fastify.pg.connect();
  try {
    const { rows: projectRows } = await client.query(
      'SELECT id FROM projects WHERE id = $1 AND studio_id = $2',
      [projectId, user.studioId],
    );

    if (projectRows.length === 0) {
      return fail(reply, 404, 'Not found', 'Project not found or does not belong to your studio');
    }

    const { rows } = await client.query(
      `SELECT COUNT(*) as total_count FROM photos WHERE project_id = $1`,
      [projectId],
    );

    return ok(reply, {
      total_count: parseInt(rows[0].total_count, 10),
    });
  } catch (error) {
    fastify.log.error({ err: error }, 'Error fetching project photos count');
    return fail(reply, 500, 'Internal server error', error.message);
  } finally {
    client.release();
  }
}
