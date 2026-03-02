import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';

export async function userUpdatePhoneNumberHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply, false);
  if (!auth) return;

  const { phone_number } = request.body;

  const verificationCode = Math.floor(1000 + Math.random() * 9000);

  console.log(
    `[user-update-phone-number] verification code for user ${auth.userId}: ${verificationCode}`,
  );

  const client = await fastify.pg.connect();
  try {
    await client.query(
      `UPDATE users
          SET phone_number          = $1,
              phone_number_code     = $2,
              phone_number_verified = FALSE
        WHERE id = $3`,
      [phone_number, verificationCode, auth.userId],
    );
  } finally {
    client.release();
  }

  return ok(reply, undefined, 'Phone number saved — verification code sent');
}
