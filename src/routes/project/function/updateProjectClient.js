import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function updateProjectClientHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { clientId, projectId, name, phone_number, email, is_whatsapp, share_settings } =
    request.body;

  if (!clientId || !projectId) {
    return fail(reply, 400, 'Bad Request', 'clientId and projectId are required');
  }

  // Ensure there's something to update
  if (
    !name &&
    phone_number === undefined &&
    email === undefined &&
    is_whatsapp === undefined &&
    share_settings === undefined
  ) {
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

    // 2. Build the dynamic update query
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (phone_number !== undefined) {
      fieldsToUpdate.push(`phone_number = $${paramIndex++}`);
      values.push(phone_number);
    }
    if (email !== undefined) {
      fieldsToUpdate.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (is_whatsapp !== undefined) {
      fieldsToUpdate.push(`is_whatsapp = $${paramIndex++}`);
      values.push(is_whatsapp);
    }
    if (share_settings !== undefined) {
      fieldsToUpdate.push(`share_settings = $${paramIndex++}`);
      values.push(share_settings);
    }

    if (fieldsToUpdate.length === 0) {
      return fail(reply, 400, 'Bad Request', 'No valid fields provided to update');
    }

    // Add ID constraints at the end
    values.push(clientId, projectId);

    const { rows } = await clientDb.query(
      `UPDATE project_clients
       SET ${fieldsToUpdate.join(', ')}
       WHERE id = $${paramIndex} AND project_id = $${paramIndex + 1}
       RETURNING id, name, phone_number, email, is_whatsapp, share_settings, is_suspended`,
      values,
    );

    if (rows.length === 0) {
      return fail(reply, 404, 'Not found', 'Client not found in this project');
    }

    return ok(reply, { client: rows[0] }, 'Client updated successfully');
  } catch (err) {
    fastify.log.error({ err }, 'Update project client error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    clientDb.release();
  }
}
