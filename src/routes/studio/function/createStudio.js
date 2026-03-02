import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';
import { signToken } from '../../../helpers/jwt.js';

export async function createStudioHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, false);
  if (!user) return;

  const { studio_name, website_url, city, country, address, logo_url } = request.body;

  if (!studio_name || studio_name.trim().length < 3) {
    return fail(
      reply,
      400,
      'Bad Request',
      'Studio name is required and must be at least 3 characters long',
    );
  }
  const client = await fastify.pg.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO studios (studio_name, website_url, city, country, address, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, studio_name, website_url, city, country, address, logo_url,
                 plan_id, modules, expires_on, created_at`,
      [
        studio_name,
        website_url ?? null,
        city ?? null,
        country ?? null,
        address ?? null,
        logo_url ?? null,
      ],
    );

    const studio = rows[0];

    const userRow = await client.query('SELECT id FROM users WHERE email = $1', [user.userEmail]);

    if (userRow.rows.length === 0) {
      await client.query('ROLLBACK');
      return fail(reply, 404, 'Not found', 'Authenticated user not found');
    }

    const userId = userRow.rows[0].id;

    await client.query(
      `INSERT INTO user_studios (user_id, studio_id, type)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [userId, studio.id, 'owner'],
    );

    await client.query('COMMIT');

    const token = signToken({ studioId: studio.id, userId, userEmail: user.userEmail });
    return ok(reply, { ...studio, token }, 'Studio created successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return fail(reply, 409, 'Conflict', `Studio name "${studio_name}" is already taken`);
    }
    fastify.log.error({ err }, 'Create studio error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
