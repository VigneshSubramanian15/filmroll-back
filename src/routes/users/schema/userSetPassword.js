import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const userSetPasswordSchema = {
  description: `Set or reset a password.
- **New user** (\`newUser: true\` in token): creates the user record and returns a full session JWT.
- **Existing user** (\`newUser: false\` in token): updates the password and returns a confirmation message.`,
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        minLength: 8,
        description: 'New password (min 8 characters)',
      },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: { token: { type: 'string' } },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
