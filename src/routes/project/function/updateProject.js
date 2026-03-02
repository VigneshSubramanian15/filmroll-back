import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function updateProjectHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply);
  if (!auth) return;

  const { studioId } = auth;
  const { projectId, name, description, cover_image, project_url, client_view } = request.body;

  const fields = [];
  const values = [];
  let idx = 1;

  if (name != null) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (description != null) {
    fields.push(`description = $${idx++}`);
    values.push(description);
  }
  if (cover_image != null) {
    fields.push(`cover_image = $${idx++}`);
    values.push(cover_image);
  }
  if (project_url != null) {
    fields.push(`project_url = $${idx++}`);
    values.push(project_url);
  }
  if (client_view != null) {
    fields.push(`client_view = $${idx++}`);
    values.push(client_view);
  }

  if (fields.length === 0) {
    return fail(
      reply,
      400,
      'Bad request',
      'Provide at least one of: name, description, cover_image, project_url, client_view',
    );
  }

  values.push(projectId, studioId);

  const client = await fastify.pg.connect();
  try {
    const { rowCount } = await client.query(
      `UPDATE projects
          SET ${fields.join(', ')}
        WHERE id = $${idx} AND studio_id = $${idx + 1}`,
      values,
    );

    if (rowCount === 0) {
      return fail(reply, 404, 'Not found', 'Project not found or does not belong to your studio');
    }

    return ok(reply, undefined, 'Project updated successfully');
  } catch (err) {
    if (err.code === '23505' && err.constraint?.includes('project_url')) {
      return fail(reply, 409, 'Conflict', 'This project URL is already in use');
    }
    fastify.log.error({ err }, 'update-project error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
