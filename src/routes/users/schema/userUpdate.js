import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const userUpdateSchema = {
  description: "Update the authenticated user's name and/or email.",
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 1, description: 'Display name' },
      email: { type: 'string', format: 'email', description: 'New email address' },
    },
  },
  response: {
    200: successEnvelope(),
    400: errorEnvelope,
    401: errorEnvelope,
    409: errorEnvelope,
    500: errorEnvelope,
  },
};
