import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const viewPhotosSchema = {
  description: 'View folders and photos inside a project or specific folder with pagination',
  tags: ['Photos'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    required: ['projectId'],
    properties: {
      projectId: { type: 'integer', description: 'ID of the project' },
      folderId: { type: 'integer', description: 'Optional folder ID (root if omitted)' },
      page: { type: 'integer', default: 1, minimum: 1, description: 'Page number' },
      limit: {
        type: 'integer',
        default: 50,
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
        folders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              parent_id: { type: 'integer', nullable: true },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
        },
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
    403: errorEnvelope,
    500: errorEnvelope,
  },
};
