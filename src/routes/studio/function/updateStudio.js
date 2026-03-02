import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function updateStudioHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { studio_name, website_url, city, country, address, logo_url } = request.body || {};

  if (!request.body || Object.keys(request.body).length === 0) {
    return fail(reply, 400, 'Bad Request', 'At least one field must be provided to update');
  }

  if (studio_name !== undefined && studio_name.trim().length < 3) {
    return fail(reply, 400, 'Bad Request', 'Studio name must be at least 3 characters long');
  }

  const fieldsToUpdate = [];
  const values = [];
  let paramIndex = 1;

  if (studio_name !== undefined) {
    fieldsToUpdate.push(`studio_name = $${paramIndex++}`);
    values.push(studio_name);
  }
  if (website_url !== undefined) {
    fieldsToUpdate.push(`website_url = $${paramIndex++}`);
    values.push(website_url);
  }
  if (city !== undefined) {
    fieldsToUpdate.push(`city = $${paramIndex++}`);
    values.push(city);
  }
  if (country !== undefined) {
    fieldsToUpdate.push(`country = $${paramIndex++}`);
    values.push(country);
  }
  if (address !== undefined) {
    fieldsToUpdate.push(`address = $${paramIndex++}`);
    values.push(address);
  }
  if (logo_url !== undefined) {
    fieldsToUpdate.push(`logo_url = $${paramIndex++}`);
    values.push(logo_url);
  }

  if (fieldsToUpdate.length === 0) {
    return fail(reply, 400, 'Bad Request', 'No valid fields provided to update');
  }

  values.push(user.studioId);
  const studioIdParam = paramIndex;

  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      `UPDATE studios
       SET ${fieldsToUpdate.join(', ')}
       WHERE id = $${studioIdParam}
       RETURNING id, studio_name, website_url, city, country, address, logo_url,
                 plan_id, modules, expires_on, created_at`,
      values,
    );

    if (rows.length === 0) {
      return fail(reply, 404, 'Not found', 'Studio not found');
    }

    return ok(reply, rows[0], 'Studio updated successfully');
  } catch (err) {
    if (err.code === '23505') {
      // unique violation
      return fail(reply, 409, 'Conflict', `Studio name "${studio_name}" is already taken`);
    }
    fastify.log.error({ err }, 'Update studio error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
