import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const getProjectAlbumsSchema = {
  description: 'Get all albums for a specific project.',
  tags: ['Project'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    required: ['projectId'],
    properties: {
      projectId: { type: 'integer', description: 'ID of the project' },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        albums: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              photo_selection_count: { type: 'integer' },
            },
          },
        },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
