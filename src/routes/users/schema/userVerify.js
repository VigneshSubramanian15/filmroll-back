import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const userVerifySchema = {
  description:
    'Verify User with email and code. On success, returns a short-lived JWT for setting the password.',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['email', 'code'],
    properties: {
      email: { type: 'string', format: 'email' },
      code: {
        type: 'integer',
        minimum: 100000,
        maximum: 999999,
        description: '6-digit verification code',
      },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: { token: { type: 'string' } },
    }),
    400: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
