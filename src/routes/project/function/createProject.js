import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

function sanitizeToUrl(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniqueProjectUrl(client, candidate) {
  let url = candidate;
  let suffix = 1;
  while (true) {
    const { rows } = await client.query('SELECT 1 FROM projects WHERE project_url = $1 LIMIT 1', [
      url,
    ]);
    if (rows.length === 0) return url;
    url = `${candidate}-${suffix++}`;
  }
}

export async function createProjectHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply);
  if (!auth) return;

  const { studioId } = auth;
  const { name } = request.body;

  const client = await fastify.pg.connect();
  try {
    const slug = sanitizeToUrl(name) || 'project';
    const projectUrl = await uniqueProjectUrl(client, slug);

    const { rows } = await client.query(
      `INSERT INTO projects (name, studio_id, project_url)
       VALUES ($1, $2, $3)
       RETURNING id, project_url`,
      [name, studioId, projectUrl],
    );

    const projectId = rows[0].id;

    return ok(
      reply,
      { project_id: projectId, project_url: rows[0].project_url },
      'Project created successfully',
    );
  } catch (err) {
    fastify.log.error({ err }, 'create-project error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
