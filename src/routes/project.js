import { ok, fail } from '../helpers/respond.js';
import { successEnvelope, errorEnvelope } from '../helpers/schema.js';
import { requireAuth } from '../helpers/auth-guard.js';

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
            project_url: { type: 'string', description: 'Generated project URL slug' },
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
        // Build a unique project_url from the name
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
    },
  });

  // -------------------------------------------------------------------------
  // POST /add-project-album
  // -------------------------------------------------------------------------
  fastify.post('/add-project-album', {
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
  // POST /add-project-client
  // -------------------------------------------------------------------------
  fastify.post('/add-project-client', {
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

  // -------------------------------------------------------------------------
  // PATCH /update-project
  // -------------------------------------------------------------------------
  fastify.patch('/update-project', {
    schema: {
      description:
        'Update an existing project. At least one field besides projectId must be provided.',
      tags: ['Project'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'integer', description: 'ID of the project to update' },
          name: { type: 'string', minLength: 1, description: 'Project name' },
          description: { type: 'string', description: 'Project description' },
          cover_image: { type: 'string', description: 'Cover image URL' },
          project_url: { type: 'string', minLength: 1, description: 'Custom project URL slug' },
          client_view: { type: 'boolean', description: 'Whether client view is enabled' },
        },
      },
      response: {
        200: successEnvelope(),
        400: errorEnvelope,
        401: errorEnvelope,
        404: errorEnvelope,
        409: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
      const auth = await requireAuth(request, reply);
      if (!auth) return;

      const { studioId } = auth;
      const { projectId, name, description, cover_image, project_url, client_view } = request.body;

      // Build dynamic SET clause
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
          return fail(
            reply,
            404,
            'Not found',
            'Project not found or does not belong to your studio',
          );
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
    },
  });

  // -------------------------------------------------------------------------
  // POST /verify-project-url
  // -------------------------------------------------------------------------
  fastify.post('/verify-project-url', {
    schema: {
      description: 'Check whether a project URL slug is available (unique).',
      tags: ['Project'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['project_url'],
        properties: {
          project_url: {
            type: 'string',
            minLength: 1,
            description: 'The URL slug to check',
          },
        },
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: {
            available: {
              type: 'boolean',
              description: 'true if the URL is available',
            },
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

      const { project_url } = request.body;

      const client = await fastify.pg.connect();
      try {
        const { rows } = await client.query(
          'SELECT 1 FROM projects WHERE project_url = $1 LIMIT 1',
          [project_url],
        );

        const available = rows.length === 0;

        return ok(reply, { available }, available ? 'URL is available' : 'URL is already taken');
      } catch (err) {
        fastify.log.error({ err }, 'verify-project-url error');
        return fail(reply, 500, 'Internal server error', err.message);
      } finally {
        client.release();
      }
    },
  });

  // -------------------------------------------------------------------------
  // PATCH /project-add-passcode
  // -------------------------------------------------------------------------
  fastify.patch('/set-project-auth', {
    schema: {
      description:
        'Set the authentication type for a project. If PassCode, a passcode value is required. For EmailOTP / MobileOTP the passcode is cleared.',
      tags: ['Project'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['auth_type', 'projectId'],
        properties: {
          auth_type: {
            type: 'string',
            enum: ['PassCode', 'EmailOTP', 'MobileOTP'],
            description: 'Authentication method for the project',
          },
          projectId: {
            type: 'integer',
            description: 'ID of the project',
          },
          passcode: {
            type: 'integer',
            description: 'Passcode value (required when auth_type is PassCode)',
          },
        },
      },
      response: {
        200: successEnvelope(),
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
      const { auth_type, projectId, passcode } = request.body;

      if (auth_type === 'PassCode' && passcode == null) {
        return fail(reply, 400, 'Bad request', 'passcode is required when auth_type is PassCode');
      }

      const client = await fastify.pg.connect();
      try {
        const { rows: projectRows } = await client.query(
          'SELECT id FROM projects WHERE id = $1 AND studio_id = ANY($2)',
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
    },
  });
}
