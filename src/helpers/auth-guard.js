import { extractBearer, verifyToken } from './jwt.js';
import { fail } from './respond.js';

/**
 * Extracts, verifies the session Bearer token and returns the decoded payload.
 * If the token is missing or invalid the error reply is sent and `null` is returned —
 * the caller should return immediately when this function returns `null`.
 *
 * @param {import('fastify').FastifyRequest}  request
 * @param {import('fastify').FastifyReply}    reply
 * @param {boolean}                           requireStudioId - If true (default), validates that the token contains a studioId
 * @returns {Promise<{ userId: number, userEmail: string, studioId?: number } | null>}
 */
export async function requireAuth(request, reply, requireStudioId = true) {
  const raw = extractBearer(request.headers.authorization);
  if (!raw) {
    await fail(reply, 401, 'Unauthorized', 'Authorization header with Bearer token is required');
    return null;
  }

  let decoded;
  try {
    decoded = verifyToken(raw);
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    await fail(reply, 401, 'Unauthorized', expired ? 'Token has expired' : 'Invalid token');
    return null;
  }

  // Check for studioId if required
  if (requireStudioId && !decoded.studioId) {
    await fail(
      reply,
      401,
      'Unauthorized',
      'Token does not contain a studioId — use a studio-scoped token',
    );
    return null;
  }

  return decoded;
}
