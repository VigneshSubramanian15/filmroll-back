import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function verifyProjectUrlHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply);
  if (!auth) return;

  const { project_url } = request.body;

  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query('SELECT 1 FROM projects WHERE project_url = $1 LIMIT 1', [
      project_url,
    ]);

    const available = rows.length === 0;

    return ok(reply, { available }, available ? 'URL is available' : 'URL is already taken');
  } catch (err) {
    fastify.log.error({ err }, 'verify-project-url error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
