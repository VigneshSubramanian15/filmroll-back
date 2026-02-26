import { ok, fail } from '../helpers/respond.js';
import { successEnvelope, errorEnvelope } from '../helpers/schema.js';
import { requireAuth } from '../helpers/auth-guard.js';

export default async function projectRoutes(fastify) {
  // -------------------------------------------------------------------------
  // POST /create-project
  // -------------------------------------------------------------------------
  fastify.post('/create-project', {
    schema: {
      description:
        'Create a new project for the studio. Requires authentication with a studio-scoped token.',
      tags: ['Project'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            description: 'Project name',
          },
        },
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: {
            project_id: { type: 'integer', description: 'ID of the created project' },
          },
        }),
        400: errorEnvelope,
        401: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
      const auth = await requireAuth(request, reply);
      if (!auth) return;

      const { studioId } = auth;
      const { name } = request.body;

      const client = await fastify.pg.connect();
      try {
        const { rows } = await client.query(
          `INSERT INTO projects (name, studio_id)
           VALUES ($1, $2)
           RETURNING id`,
          [name, studioId],
        );

        const projectId = rows[0].id;

        return ok(reply, { project_id: projectId }, 'Project created successfully');
      } catch (err) {
        fastify.log.error({ err }, 'create-project error');
        return fail(reply, 500, 'Internal server error', err.message);
      } finally {
        client.release();
      }
    },
  });

  // -------------------------------------------------------------------------
  // POST /add-album-to-project
  // -------------------------------------------------------------------------
  fastify.post('/add-album-to-project', {
    schema: {
      description:
        'Add a new album to an existing project. Requires authentication with a studio-scoped token.',
      tags: ['Project'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'projectId', 'photo_selection_count'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            description: 'Album name',
          },
          projectId: {
            type: 'integer',
            description: 'ID of the project to add the album to',
          },
          photo_selection_count: {
            type: 'integer',
            minimum: 0,
            description: 'Number of photos that can be selected in this album',
          },
        },
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: {
            album_id: { type: 'integer', description: 'ID of the created album' },
          },
        }),
        400: errorEnvelope,
        401: errorEnvelope,
        404: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
      const auth = await requireAuth(request, reply);
      if (!auth) return;

      const { studioId } = auth;
      const { name, projectId, photo_selection_count } = request.body;

      const client = await fastify.pg.connect();
      try {
        // Verify the project exists and belongs to the studio
        const { rows: projectRows } = await client.query(
          'SELECT id FROM projects WHERE id = $1 AND studio_id = $2',
          [projectId, studioId],
        );

        if (projectRows.length === 0) {
          return fail(
            reply,
            404,
            'Not found',
            'Project not found or does not belong to your studio',
          );
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
    },
  });

  // -------------------------------------------------------------------------
  // POST /add-client-to-project
  // -------------------------------------------------------------------------
  fastify.post('/add-client-to-project', {
    schema: {
      description:
        'Add a new client to an existing project. Either email or phone_number must be provided. Requires authentication with a studio-scoped token.',
      tags: ['Project'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'projectId'],
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            description: 'Client name',
          },
          projectId: {
            type: 'integer',
            description: 'ID of the project to add the client to',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Client email address (required if phone_number not provided)',
          },
          phone_number: {
            type: 'integer',
            description: 'Client phone number (required if email not provided)',
          },
        },
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: {
            client_id: { type: 'integer', description: 'ID of the created client' },
          },
        }),
        400: errorEnvelope,
        401: errorEnvelope,
        404: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
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
          return fail(
            reply,
            404,
            'Not found',
            'Project not found or does not belong to your studio',
          );
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
    },
  });
}
