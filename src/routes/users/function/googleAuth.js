import { OAuth2Client } from 'google-auth-library';
import { ok, fail } from '../../../helpers/respond.js';
import { signToken } from '../../../helpers/jwt.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function googleAuthHandler(request, reply) {
  const fastify = this;
  const { idToken } = request.body;

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return fail(reply, 401, 'Unauthorized', 'Invalid Google ID token');
  }

  const { sub: googleId, email, name, picture } = payload;

  if (!email) {
    return fail(reply, 400, 'Bad Request', 'Google account does not have an email address');
  }

  const pgClient = await fastify.pg.connect();
  try {
    // Look up existing user by auth_provider_id or email
    const { rows: userRows } = await pgClient.query(
      `SELECT id, name, email, auth_provider_id, auth_provider
       FROM users
       WHERE auth_provider_id = $1 OR email = $2
       LIMIT 1`,
      [googleId, email.toLowerCase()],
    );

    let user;
    let isNewUser = false;

    if (userRows.length > 0) {
      user = userRows[0];

      // Link auth_provider_id if user exists by email but hasn't linked Google yet
      if (!user.auth_provider_id) {
        await pgClient.query(
          'UPDATE users SET auth_provider_id = $1, auth_provider = $2 WHERE id = $3',
          [googleId, user.auth_provider === 'local' ? 'local' : user.auth_provider, user.id],
        );
      }

      // Update last_login
      await pgClient.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    } else {
      // Auto-register new user
      const { rows: newRows } = await pgClient.query(
        `INSERT INTO users (name, email, auth_provider_id, auth_provider, last_login)
         VALUES ($1, $2, $3, 'google', NOW())
         RETURNING id, name, email`,
        [name, email.toLowerCase(), googleId],
      );
      user = newRows[0];
      isNewUser = true;
    }

    // Fetch studio access (same pattern as login.js)
    const { rows: accessRows } = await pgClient.query(
      `SELECT us.studio_id, us.access, us.type,
              s.studio_name, s.logo_url
       FROM user_studios us
       JOIN studios s ON us.studio_id = s.id
       WHERE us.user_id = $1 AND s.is_deleted = FALSE AND s.is_suspended = FALSE`,
      [user.id],
    );

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
    }

    const token = signToken(tokenPayload);

    // New user with no studios
    if (isNewUser || accessRows.length === 0) {
      return ok(
        reply,
        {
          name: user.name,
          email: user.email,
          token,
          newUser: isNewUser,
        },
        isNewUser ? 'New user' : 'Login successful — no studio assigned',
      );
    }

    // Multiple studios — client must pick
    if (accessRows.length > 1) {
      return ok(
        reply,
        {
          studios: accessRows.map((a) => ({
            studio_id: a.studio_id,
            studio_name: a.studio_name,
            logo_url: a.logo_url,
          })),
          name: user.name,
          email: user.email,
          token,
          newUser: false,
        },
        'Select Studio to Login',
      );
    }

    // Single studio
    return ok(
      reply,
      {
        name: user.name,
        email: user.email,
        studio_name: accessRows[0].studio_name,
        logo_url: accessRows[0].logo_url,
        access: accessRows[0].access,
        type: accessRows[0].type,
        token,
        newUser: false,
      },
      'Login successful',
    );
  } finally {
    pgClient.release();
  }
}
