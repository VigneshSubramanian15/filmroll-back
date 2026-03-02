import { ok, fail } from '../../../helpers/respond.js';
import { signPasswordResetToken } from '../../../helpers/jwt.js';

export async function userVerifyHandler(request, reply) {
  const fastify = this;
  const { email, code } = request.body;

  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      'SELECT secret_code FROM unverified_users WHERE email = $1',
      [email.toLowerCase()],
    );

    if (rows.length === 0) {
      return fail(reply, 404, 'Not found', 'No pending verification for this email');
    }
    console.log(rows[0].secret_code, code);
    if (Number(rows[0].secret_code) !== code) {
      return fail(reply, 400, 'Invalid code', 'The verification code is incorrect');
    }
  } finally {
    client.release();
  }

  const token = signPasswordResetToken(
    { email: email.toLowerCase(), newUser: true },
    process.env.JWT_PASSWORD_RESET_EXPIRES_IN,
  );

  return ok(reply, { token }, 'Email verified — use the token to set your password');
}
