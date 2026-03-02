import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function userVerifyPhoneNumberHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply, false);
  if (!auth) return;

  const { code } = request.body;

  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query('SELECT phone_number_code FROM users WHERE id = $1', [
      auth.userId,
    ]);

    if (rows.length === 0) {
      return fail(reply, 404, 'Not found', 'User not found');
    }

    if (rows[0].phone_number_code === null) {
      return fail(reply, 400, 'Bad request', 'No pending phone verification for this account');
    }

    if (Number(rows[0].phone_number_code) !== code) {
      return fail(reply, 400, 'Invalid code', 'The verification code is incorrect');
    }

    await client.query(
      `UPDATE users
          SET phone_number_code     = NULL,
              phone_number_verified = TRUE
        WHERE id = $1`,
      [auth.userId],
    );
  } finally {
    client.release();
  }

  return ok(reply, undefined, 'Phone number verified successfully');
}
