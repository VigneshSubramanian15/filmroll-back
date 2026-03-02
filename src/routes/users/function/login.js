import bcrypt from 'bcryptjs';
import { ok, fail } from '../../../helpers/respond.js';
import { signToken } from '../../../helpers/jwt.js';

export async function loginHandler(request, reply) {
  const fastify = this;
  const { email, phone_number, password } = request.body;

  const client = await fastify.pg.connect();
  try {
    let userQuery;
    let userParams;

    if (email) {
      userQuery =
        'SELECT id, name, email, password FROM users WHERE email = $1 AND is_suspended = FALSE';
      userParams = [email.toLowerCase()];
    } else {
      userQuery =
        'SELECT id, name, email, password FROM users WHERE phone_number = $1 AND is_suspended = FALSE';
      userParams = [phone_number];
    }

    const { rows: userRows } = await client.query(userQuery, userParams);

    if (userRows.length === 0) {
      return fail(reply, 404, 'Not found', 'No account found with the provided credentials');
    }

    const user = userRows[0];

    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return fail(reply, 401, 'Unauthorized', 'Invalid password');
    }

    const { rows: accessRows } = await client.query(
      `SELECT us.studio_id, us.access, us.type,
              s.studio_name, s.logo_url
       FROM user_studios us
       JOIN studios s ON us.studio_id = s.id
       WHERE us.user_id = $1 AND s.is_deleted = FALSE AND s.is_suspended = FALSE`,
      [user.id],
    );
    await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const tokenPayload = { userId: user.id, userEmail: user.email, name: user.name };
    if (accessRows.length > 1) {
      tokenPayload.studios = accessRows.map((a) => ({
        studio_id: a.studio_id,
        studio_name: a.studio_name,
        logo_url: a.logo_url,
        access: a.access,
        type: a.type,
      }));
    } else if (accessRows.length === 1) {
      tokenPayload.studioId = accessRows[0].studio_id;
      tokenPayload.access = accessRows[0].access;
      tokenPayload.type = accessRows[0].type;
    } else {
      return fail(reply, 403, 'Forbidden', 'User does not have access to any studio');
    }

    const token = signToken(tokenPayload);
    console.log('>>>>>>>>>>>>>>>> ', accessRows);
    return ok(
      reply,
      accessRows.length > 1
        ? {
            studios: accessRows.map((a) => ({
              studio_id: a.studio_id,
              studio_name: a.studio_name,
              logo_url: a.logo_url,
            })),
            name: user.name,
            email: user.email,
            token,
          }
        : {
            name: user.name,
            email: user.email,
            studio_name: accessRows[0].studio_name,
            logo_url: accessRows[0].logo_url,
            access: accessRows[0].access,
            type: accessRows[0].type,
            token,
          },
      accessRows.length > 1 ? 'Select Studio to Login' : 'Login successful',
    );
  } finally {
    client.release();
  }
}
