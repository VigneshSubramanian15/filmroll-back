import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function addProjectAlbumHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply);
  if (!auth) return;

  const { studioId } = auth;
  const { name, projectId, photo_selection_count } = request.body;

  const client = await fastify.pg.connect();
  try {
    const { rows: projectRows } = await client.query(
      'SELECT id FROM projects WHERE id = $1 AND studio_id = $2',
      [projectId, studioId],
    );

    if (projectRows.length === 0) {
      return fail(reply, 404, 'Not found', 'Project not found or does not belong to your studio');
    }

    const { rows } = await client.query(
      `INSERT INTO project_albums (name, project_id, photo_selection_count)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, projectId, photo_selection_count],
    );

    const albumId = rows[0].id;

    return ok(reply, { album_id: albumId }, 'Album added to project successfully');
  } catch (err) {
    fastify.log.error({ err }, 'add-album-to-project error');
    return fail(reply, 500, 'Internal server error', err.message);
  } finally {
    client.release();
  }
}
