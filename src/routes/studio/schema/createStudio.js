import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const studioDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    studio_name: { type: 'string' },
    website_url: { type: 'string' },
    city: { type: 'string' },
    country: { type: 'string' },
    address: { type: 'string' },
    logo_url: { type: 'string' },
    plan_id: { type: 'integer' },
    modules: { type: 'array', items: { type: 'string' } },
    expires_on: { type: 'string' },
    created_at: { type: 'string' },
    token: { type: 'string' },
  },
};

export const createStudioSchema = {
  description:
    'Create a new studio. The authenticated user is automatically linked to it via user_studios. Plan defaults to Basic Plan if not specified.',
  tags: ['Studio'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['studio_name'],
    properties: {
      studio_name: { type: 'string', minLength: 3, description: 'Unique studio name' },
      website_url: { type: 'string', description: 'Studio website URL' },
      city: { type: 'string' },
      country: { type: 'string' },
      address: { type: 'string' },
      logo_url: { type: 'string', description: 'URL of the studio logo' },
    },
  },
  response: {
    201: successEnvelope(studioDataSchema),
    400: errorEnvelope,
    401: errorEnvelope,
    409: errorEnvelope,
    500: errorEnvelope,
  },
};
