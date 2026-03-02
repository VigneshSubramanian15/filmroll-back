import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const getProjectClientsSchema = {
  description: 'Get all active (not suspended) clients for a specific project.',
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
        clients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              phone_number: { type: ['string', 'number', 'null'] },
              email: { type: ['string', 'null'] },
              is_whatsapp: { type: 'boolean' },
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
