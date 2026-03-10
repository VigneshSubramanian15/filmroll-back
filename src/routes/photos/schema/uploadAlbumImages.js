import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const uploadAlbumImagesSchema = {
  description: 'Upload multiple images to a project album',
  tags: ['Photos'],
  security: [{ bearerAuth: [] }],
  consumes: ['multipart/form-data'],
  querystring: {
    type: 'object',
    required: ['projectId'],
    properties: {
      projectId: {
        type: 'integer',
        description: 'ID of the project to upload images to',
      },
      folderId: {
        type: 'integer',
        description: 'Optional ID of the specific folder to upload to (root if omitted)',
      },
    },
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        uploaded: { type: 'number' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string' },
              sequenceId: { type: 'number' },
              label: { type: 'string' },
              mimetype: { type: 'string' },
              size: { type: 'number' },
            },
          },
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filename: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    }),
    400: errorEnvelope,
    401: errorEnvelope,
    403: errorEnvelope,
    500: errorEnvelope,
  },
};
