/**
 * Unified API response helpers.
 * Every endpoint should go through one of these so the shape is always consistent.
 *
 * Success envelope:  { success: true,  data?,   message? }
 * Error   envelope:  { success: false, error,   message  }
 */

/**
 * @param {import('fastify').FastifyReply} reply
 * @param {unknown}  data      - payload to return to the client
 * @param {string}   [message] - optional human-readable note
 * @param {number}   [code=200]
 */
export function ok(reply, data, message, code = 200) {
  console.log('Responding with success:', { data, message, code });
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return reply.code(code).send(body);
}

/**
 * @param {import('fastify').FastifyReply} reply
 * @param {number} code        - HTTP status code
 * @param {string} error       - short machine-readable label
 * @param {string} message     - human-readable explanation
 * @param {Record<string, unknown>} [extras] - any extra fields merged into the body
 */
export function fail(reply, code, error, message, extras = {}) {
  return reply.code(code).send({ success: false, error, message, ...extras });
}
