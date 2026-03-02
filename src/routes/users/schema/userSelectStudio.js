import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const userSelectStudioSchema = {
  description:
    'Select a studio after multi-studio login. Requires a valid session JWT (without studioId). Returns user info with studio-scoped token.',
  tags: ['User'],
  headers: {
    type: 'object',
    required: ['authorization'],
    properties: {
      authorization: { type: 'string', description: 'Bearer <token>' },
    },
  },
  body: {
    type: 'object',
    required: ['studioId'],
    properties: {
      studioId: { type: 'integer', description: 'The studio ID to select' },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        studio_name: { type: 'string' },
        logo_url: { type: 'string' },
        access: { type: 'array' },
        type: { type: 'string' },
        token: { type: 'string' },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    403: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
