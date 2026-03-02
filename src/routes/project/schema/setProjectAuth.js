import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const setProjectAuthSchema = {
  description:
    'Set the authentication type for a project. If PassCode, a passcode value is required. For EmailOTP / MobileOTP the passcode is cleared.',
  tags: ['Project'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['auth_type', 'projectId'],
    properties: {
      auth_type: {
        type: 'string',
        enum: ['PassCode', 'EmailOTP', 'MobileOTP'],
        description: 'Authentication method for the project',
      },
      projectId: {
        type: 'integer',
        description: 'ID of the project',
      },
      passcode: {
        type: 'integer',
        description: 'Passcode value (required when auth_type is PassCode)',
      },
    },
  },
  response: {
    200: successEnvelope(),
    400: errorEnvelope,
    401: errorEnvelope,
    404: errorEnvelope,
    500: errorEnvelope,
  },
};
