import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function setProjectAuthHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply);
  if (!auth) return;

  const { studioId } = auth;
  const { auth_type, projectId, passcode } = request.body;

  if (auth_type === 'PassCode' && passcode == null) {
    return fail(reply, 400, 'Bad request', 'passcode is required when auth_type is PassCode');
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

    const passcodeValue = auth_type === 'PassCode' ? passcode : null;

    await client.query('UPDATE projects SET auth_type = $1, passcode = $2 WHERE id = $3', [
      auth_type,
      passcodeValue,
      projectId,
    ]);

    return ok(reply, undefined, `${auth_type} set to the project successfully`);
  } catch (err) {
    fastify.log.error({ err }, 'project-add-passcode error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
