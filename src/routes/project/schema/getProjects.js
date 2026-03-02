import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const getProjectsSchema = {
  description: 'Get all active projects for the authenticated studio.',
  tags: ['Project'],
  security: [{ bearerAuth: [] }],
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              description: { type: ['string', 'null'] },
              cover_image: { type: ['string', 'null'] },
              project_url: { type: ['string', 'null'] },
              auth_type: { type: 'string' },
              client_view: { type: 'boolean' },
            },
          },
        },
      },
    }),
    401: errorEnvelope,
    500: errorEnvelope,
  },
};
