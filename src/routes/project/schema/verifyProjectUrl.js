import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const verifyProjectUrlSchema = {
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
};
