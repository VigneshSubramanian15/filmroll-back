import { ok, fail } from '../../../helpers/respond.js';

export async function userSignupHandler(request, reply) {
  const fastify = this;
  const { email } = request.body;

  const code = Math.floor(100000 + Math.random() * 900000);

  console.log(`[user-signup] verification code for ${email}: ${code}`);

  const client = await fastify.pg.connect();
  try {
    await client.query(
      `INSERT INTO unverified_users (email, secret_code)
       VALUES ($1, $2)
       ON CONFLICT (email)
       DO UPDATE SET secret_code = EXCLUDED.secret_code,
                     updated_at  = NOW()`,
      [email.toLowerCase(), code],
    );
  } finally {
    client.release();
  }

  return ok(reply, undefined, 'Verification code sent to your email');
}
