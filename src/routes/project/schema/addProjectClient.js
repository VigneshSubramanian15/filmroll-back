import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const addProjectClientSchema = {
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
};
