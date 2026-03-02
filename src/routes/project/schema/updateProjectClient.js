import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const updateProjectClientSchema = {
  description: 'Update a client attached to a specific project. Requires studio authentication.',
  tags: ['Project'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['clientId', 'projectId'],
    properties: {
      clientId: { type: 'integer', description: 'ID of the client to update' },
      projectId: { type: 'integer', description: 'ID of the associated project' },
      name: { type: 'string', minLength: 1 },
      phone_number: { type: ['number', 'string', 'null'] },
      email: { type: ['string', 'null'] },
      is_whatsapp: { type: 'boolean' },
      share_settings: { type: 'string', enum: ['ViewOnly', 'DownloadFiles', 'DownloadRaw'] },
    },
    additionalProperties: false,
  },
  response: {
    200: successEnvelope({
      type: 'object',
      properties: {
        client: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            phone_number: { type: ['number', 'string', 'null'] },
            email: { type: ['string', 'null'] },
            is_whatsapp: { type: 'boolean' },
            share_settings: { type: 'string' },
            is_suspended: { type: 'boolean' },
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
