import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';
import { signToken } from '../../../helpers/jwt.js';

export async function userSelectStudioHandler(request, reply) {
  const decoded = await requireAuth(request, reply, false);
  if (!decoded) return;

  const { studioId } = request.body;

  if (!decoded.studios || !Array.isArray(decoded.studios)) {
    return fail(reply, 400, 'Bad Request', 'Token does not contain multiple studios');
  }

  const studio = decoded.studios.find((s) => s.studio_id === studioId);
  if (!studio) {
    return fail(reply, 403, 'Forbidden', 'You do not have access to this studio');
  }

  const tokenPayload = {
    userId: decoded.userId,
    userEmail: decoded.userEmail,
    studioId: studio.studio_id,
    access: studio.access,
    type: studio.type,
  };

  const token = signToken(tokenPayload);

  return ok(
    reply,
    {
      name: decoded.name,
      email: decoded.userEmail,
      studio_name: studio.studio_name,
      logo_url: studio.logo_url,
      access: studio.access,
      type: studio.type,
      token,
    },
    'Login successful',
  );
}
