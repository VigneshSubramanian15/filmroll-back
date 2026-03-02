import bcrypt from 'bcryptjs';
import { ok, fail } from '../../../helpers/respond.js';
import { signToken, extractBearer, verifyPasswordResetToken } from '../../../helpers/jwt.js';
import { SALT_ROUNDS } from '../../../helpers/schema.js';

export async function userSetPasswordHandler(request, reply) {
  const fastify = this;
  const raw = extractBearer(request.headers.authorization);
  if (!raw) {
    return fail(reply, 401, 'Unauthorized', 'Authorization header with Bearer token is required');
  }

  let decoded;
  try {
    decoded = verifyPasswordResetToken(raw);
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    return fail(reply, 401, 'Unauthorized', expired ? 'Token has expired' : 'Invalid token');
  }

  const { email, newUser } = decoded;
  const { password } = request.body;

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const client = await fastify.pg.connect();

  try {
    if (newUser) {
      await client.query('BEGIN');

      try {
        const { rows } = await client.query(
          `INSERT INTO users (email, password, last_login)
           VALUES ($1, $2, NOW())
           RETURNING id`,
          [email, hashed],
        );

        await client.query('DELETE FROM unverified_users WHERE email = $1', [email]);

        await client.query('COMMIT');

        const userId = rows[0].id;
        const token = signToken({ userEmail: email, userId });

        return ok(reply, { token }, 'Account created successfully');
      } catch (err) {
        await client.query('ROLLBACK');
        return fail(reply, 500, 'Internal server error', 'Failed to create account');
      }
    } else {
      const { rowCount } = await client.query('UPDATE users SET password = $1 WHERE email = $2', [
        hashed,
        email,
      ]);

      if (rowCount === 0) {
        return fail(reply, 404, 'Not found', 'No user found with this email');
      }

      return ok(reply, undefined, 'Password updated');
    }
  } finally {
    client.release();
  }
}
