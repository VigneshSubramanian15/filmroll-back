import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const getProjectPhotosSchema = {
  description: 'Get photos for a specific project with pagination',
  tags: ['Project'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    required: ['projectId'],
    properties: {
      projectId: { type: 'integer', description: 'ID of the project' },
      page: { type: 'integer', default: 1, minimum: 1, description: 'Page number' },
      limit: {
        type: 'integer',
        default: 10,
        minimum: 1,
        maximum: 100,
        description: 'Items per page',
      },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        photos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              url: { type: 'string' },
              size: { type: 'integer' },
              sequence_id: { type: 'integer' },
              is_favourite: { type: 'boolean' },
              is_hidden: { type: 'boolean' },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
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
