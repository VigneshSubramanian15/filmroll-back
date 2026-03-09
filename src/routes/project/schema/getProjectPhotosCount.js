import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const getProjectPhotosCountSchema = {
  description: 'Get total count of photos for a specific project',
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
        total_count: { type: 'integer' },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
