import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const updateProjectSchema = {
  description: 'Update an existing project. At least one field besides projectId must be provided.',
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
};
