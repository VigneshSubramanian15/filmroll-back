// ---------------------------------------------------------------------------
// Reusable OpenAPI / JSON-Schema response shapes
// ---------------------------------------------------------------------------

/**
 * Wraps a data schema in the standard success envelope.
 * @param {object|undefined} dataSchema - optional JSON Schema object for the `data` field
 */
export const successEnvelope = (dataSchema) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    ...(dataSchema ? { data: dataSchema } : {}),
  },
});

export const errorEnvelope = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
};

// ---------------------------------------------------------------------------
// Auth constants
// ---------------------------------------------------------------------------

/** bcrypt salt rounds — increase for stronger hashing (costs more CPU) */
export const SALT_ROUNDS = 12;
