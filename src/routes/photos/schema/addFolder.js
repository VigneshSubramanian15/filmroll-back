import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const addFolderSchema = {
  description: 'Add a new folder to a project',
  tags: ['Photos'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['projectId', 'name'],
    properties: {
      projectId: { type: 'integer', description: 'ID of the project' },
      name: { type: 'string', description: 'Name of the folder' },
      parentId: { type: 'integer', description: 'Optional ID of the parent folder' },
    },
  },
  response: {
    201: successEnvelope({
      type: 'object',
      properties: {
        folder: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            project_id: { type: 'integer' },
            parent_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
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
