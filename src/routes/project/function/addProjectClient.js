import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function addProjectClientHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply);
  if (!auth) return;

  const { studioId } = auth;
  const { name, projectId, email, phone_number } = request.body;

  if (!email && !phone_number) {
    return fail(reply, 400, 'Bad request', 'Either email or phone_number must be provided');
  }

  const client = await fastify.pg.connect();
  try {
    const { rows: projectRows } = await client.query(
      'SELECT id FROM projects WHERE id = $1 AND studio_id = $2',
      [projectId, studioId],
    );

    if (projectRows.length === 0) {
      return fail(reply, 404, 'Not found', 'Project not found or does not belong to your studio');
    }

    const fields = ['name', 'project_id'];
    const values = [name, projectId];

    if (email) {
      fields.push('email');
      values.push(email.toLowerCase());
    }
    if (phone_number != null) {
      fields.push('phone_number');
      values.push(phone_number);
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await client.query(
      `INSERT INTO project_clients (${fields.join(', ')})
       VALUES (${placeholders})
       RETURNING id`,
      values,
    );

    const clientId = rows[0].id;

    return ok(reply, { client_id: clientId }, 'Client added to project successfully');
  } catch (err) {
    fastify.log.error({ err }, 'add-client-to-project error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
