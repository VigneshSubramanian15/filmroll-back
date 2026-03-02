import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const loginSchema = {
  description:
    'Log in with email or phone number + password. Returns user info, studio access list, and a session JWT.',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['password'],
    properties: {
      email: { type: 'string', format: 'email', description: 'User email address' },
      phone_number: { type: 'integer', description: 'Phone number (digits only)' },
      password: { type: 'string', minLength: 1, description: 'Account password' },
    },
    oneOf: [{ required: ['email'] }, { required: ['phone_number'] }],
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
              studio_id: { type: 'integer' },
              access: { type: 'array' },
              type: { type: 'string' },
            },
          },
        },
        token: { type: 'string' },
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
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
