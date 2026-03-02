import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const userAddNewUserSchema = {
  description:
    'Add a new user to the system and map them to the studio from the bearer token. ' +
    'If the email already exists the user is simply linked to the studio. ' +
    'New accounts are created without a password — the user must complete the normal sign-up flow to set one.',
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      name: { type: 'string', description: 'New user name' },
      email: { type: 'string', format: 'email', description: 'New user email' },
      phone_number: { type: 'integer', description: 'Phone number (optional)' },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        user_id: { type: 'integer' },
        is_new: {
          type: 'boolean',
          description: 'true = account was created, false = existing account linked',
        },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    404: errorEnvelope,
    409: errorEnvelope,
    500: errorEnvelope,
  },
};
