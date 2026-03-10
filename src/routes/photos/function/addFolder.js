import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function addFolderHandler(request, reply) {
  const fastify = this;
  const user = await requireAuth(request, reply, true);
  if (!user) return;

  const { projectId, name, parentId } = request.body;
  const { studioId } = user;

  const client = await fastify.pg.connect();
  try {
    const { rows: projectRows } = await client.query(
      `SELECT id FROM projects WHERE id = $1 AND studio_id = $2 AND is_deleted = FALSE`,
      [projectId, studioId],
    );

    if (projectRows.length === 0) {
      return fail(
        reply,
        403,
        'Forbidden',
        'Project does not belong to your studio or does not exist',
      );
    }

    if (parentId) {
      const { rows: parentRows } = await client.query(
        `SELECT id FROM project_folders WHERE id = $1 AND project_id = $2`,
        [parentId, projectId],
      );
      if (parentRows.length === 0) {
        return fail(
          reply,
          400,
          'Bad request',
          'Parent folder does not belong to this project or does not exist',
        );
      }
    }

    const { rows: folderRows } = await client.query(
      `INSERT INTO project_folders (name, project_id, parent_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, project_id, parent_id, created_at`,
      [name, projectId, parentId || null],
    );

    return ok(reply, { folder: folderRows[0] }, 'Folder created successfully', 201);
  } catch (error) {
    fastify.log.error({ err: error }, 'Error creating folder');
    return fail(reply, 500, 'Internal server error', error.message);
  } finally {
    client.release();
  }
}
