import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function getStudioHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true); // true ensures token has studioId
  if (!user) return;

  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, studio_name, website_url, city, country, address, logo_url,
              plan_id, modules, expires_on, created_at
       FROM studios
       WHERE id = $1`,
      [user.studioId],
    );

    if (rows.length === 0) {
      return fail(reply, 404, 'Not found', 'Studio not found');
    }

    return ok(reply, rows[0], 'Studio fetched successfully');
  } catch (err) {
    fastify.log.error({ err }, 'Get studio error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
