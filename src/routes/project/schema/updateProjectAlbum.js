import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const updateProjectAlbumSchema = {
  description: 'Update an album within a specific project. Requires studio authentication.',
  tags: ['Project'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['albumId', 'projectId'],
    properties: {
      albumId: { type: 'integer', description: 'ID of the album to update' },
      projectId: { type: 'integer', description: 'ID of the associated project' },
      name: { type: 'string', minLength: 1 },
      photo_selection_count: { type: 'integer', minimum: 0 },
    },
    additionalProperties: false,
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        album: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            photo_selection_count: { type: 'integer' },
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
