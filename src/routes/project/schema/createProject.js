import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const createProjectSchema = {
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
};
