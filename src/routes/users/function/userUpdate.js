import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function userUpdateHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply, false);
  if (!auth) return;

  const { name, email } = request.body;

  if (!name && !email) {
    return fail(reply, 400, 'Bad request', 'Provide at least one of: name, email');
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (name) {
    fields.push(`name  = $${idx++}`);
    values.push(name);
  }
  if (email) {
    fields.push(`email = $${idx++}`);
    values.push(email.toLowerCase());
  }
  values.push(auth.userId);

  const client = await fastify.pg.connect();
  try {
    await client.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  } catch (err) {
    if (err.code === '23505') {
      return fail(reply, 409, 'Conflict', 'This email is already in use');
    }
    throw err;
  } finally {
    client.release();
  }

  return ok(reply, undefined, 'Profile updated');
}
