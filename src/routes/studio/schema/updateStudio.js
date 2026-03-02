import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';
import { studioDataSchema } from './createStudio.js';

export const updateStudioSchema = {
  description: 'Update a studio using the studioId from the token header',
  tags: ['Studio'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    properties: {
      studio_name: { type: 'string', minLength: 3, description: 'Unique studio name' },
      website_url: { type: 'string', description: 'Studio website URL' },
      city: { type: 'string' },
      country: { type: 'string' },
      address: { type: 'string' },
      logo_url: { type: 'string', description: 'URL of the studio logo' },
    },
    additionalProperties: false,
  },
  response: {
    200: successEnvelope(studioDataSchema),
    400: errorEnvelope,
    401: errorEnvelope,
    404: errorEnvelope,
    409: errorEnvelope,
    500: errorEnvelope,
  },
};
