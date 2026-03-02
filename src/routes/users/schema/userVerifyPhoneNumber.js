import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const userVerifyPhoneNumberSchema = {
  description:
    "Verify the 4-digit code sent to the user's phone. Clears the code and marks the number as verified.",
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['code'],
    properties: {
      code: {
        type: 'integer',
        minimum: 1000,
        maximum: 9999,
        description: '4-digit verification code',
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
