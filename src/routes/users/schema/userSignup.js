import { successEnvelope, errorEnvelope } from '../../../helpers/schema.js';

export const emailBody = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', description: 'User email address' },
  },
};

export const userSignupSchema = {
  description: 'EMail Signup with email',
  tags: ['User'],
  body: emailBody,
  response: {
    200: successEnvelope(),
    400: errorEnvelope,
    500: errorEnvelope,
  },
};
