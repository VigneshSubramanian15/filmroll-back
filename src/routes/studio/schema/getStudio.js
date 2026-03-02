import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';
import { studioDataSchema } from './createStudio.js';

export const getStudioSchema = {
  description: 'Get studio information using the studioId from the token header',
  tags: ['Studio'],
  security: [{ bearerAuth: [] }],
  response: {
    200: successEnvelope(studioDataSchema),
    401: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
