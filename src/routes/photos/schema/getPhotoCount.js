import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const getPhotoCountSchema = {
  description: 'Get total count of photos and folders in a specific project or folder',
  tags: ['Photos'],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: 'object',
    required: ['projectId'],
    properties: {
      projectId: { type: 'integer', description: 'ID of the project' },
      folderId: { type: 'integer', description: 'Optional ID of the folder (root if omitted)' },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        photo_count: { type: 'integer' },
        folder_count: { type: 'integer' },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    403: errorEnvelope,
    500: errorEnvelope,
  },
};
