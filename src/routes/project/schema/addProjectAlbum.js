import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const addProjectAlbumSchema = {
  description:
    'Add a new album to an existing project. Requires authentication with a studio-scoped token.',
  tags: ['Project'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['name', 'projectId', 'photo_selection_count'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: 'Album name',
      },
      projectId: {
        type: 'integer',
        description: 'ID of the project to add the album to',
      },
      photo_selection_count: {
        type: 'integer',
        minimum: 0,
        description: 'Number of photos that can be selected in this album',
      },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        album_id: { type: 'integer', description: 'ID of the created album' },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
