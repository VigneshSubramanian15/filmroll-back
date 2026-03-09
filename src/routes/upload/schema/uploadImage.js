export const uploadTempImageSchema = {
  description: 'Upload a single image file',
  tags: ['Upload'],
  consumes: ['multipart/form-data'],
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            filename: { type: 'string' },
            originalName: { type: 'string' },
            mimetype: { type: 'string' },
            url: { type: 'string' },
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
