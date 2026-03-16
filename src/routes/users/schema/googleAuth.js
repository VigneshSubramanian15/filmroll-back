import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const googleAuthSchema = {
  description:
    'Authenticate with Google. Accepts a Google ID token, verifies it, and returns user info + session JWT. Auto-registers new users.',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['idToken'],
    properties: {
      idToken: {
        type: 'string',
        description: 'Google Sign-In credential (ID token JWT)',
      },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        type: { type: 'string' },
        access: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              limit: { type: 'string' },
            },
          },
        },
        token: { type: 'string' },
        newUser: { type: 'boolean' },
        studio_name: { type: 'string' },
        logo_url: { type: 'string' },
        studios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              studio_id: { type: 'integer' },
              studio_name: { type: 'string' },
              logo_url: { type: 'string' },
            },
          },
        },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    500: errorEnvelope,
  },
};
