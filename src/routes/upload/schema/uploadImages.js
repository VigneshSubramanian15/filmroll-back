export const uploadTempImagesSchema = {
  description: 'Upload multiple image files',
  tags: ['Upload'],
  consumes: ['multipart/form-data'],
  querystring: {
    type: 'object',
    required: ['systemId'],
    properties: {
      systemId: {
        type: 'string',
        minLength: 1,
        description: 'System identifier for the upload batch',
      },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            uploaded: { type: 'number' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  mimetype: { type: 'string' },
                  size: { type: 'number' },
                  url: { type: 'string' },
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
        },
      },
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        message: { type: 'string' },
        errors: { type: 'array' },
      },
    },
    413: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        error: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};
