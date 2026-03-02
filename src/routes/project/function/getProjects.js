import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function getProjectsHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, name, description, cover_image, project_url, auth_type, client_view
       FROM projects
       WHERE studio_id = $1 AND is_deleted = false
       ORDER BY created_at DESC`,
      [user.studioId],
    );

    return ok(reply, { projects: rows }, 'Projects fetched successfully');
  } catch (err) {
    fastify.log.error({ err }, 'Get projects error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
