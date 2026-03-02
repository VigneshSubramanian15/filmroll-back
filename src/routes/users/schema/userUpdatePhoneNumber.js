import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const userUpdatePhoneNumberSchema = {
  description:
    "Add or update the authenticated user's phone number. Generates a 4-digit verification code stored in phone_number_code.",
  tags: ['User'],
  security: [{ bearerAuth: [] }],
  body: {
    type: 'object',
    required: ['phone_number'],
    properties: {
      phone_number: {
        type: 'integer',
        description: 'Phone number digits only (no country code)',
      },
    },
  },
  response: {
    200: successEnvelope(),
    401: errorEnvelope,
    500: errorEnvelope,
  },
};
