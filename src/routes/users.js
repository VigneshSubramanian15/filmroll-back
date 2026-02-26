import bcrypt from 'bcryptjs';
import { ok, fail } from '../helpers/respond.js';
import {
  signToken,
  extractBearer,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from '../helpers/jwt.js';
import { successEnvelope, errorEnvelope, SALT_ROUNDS } from '../helpers/schema.js';
import { requireAuth } from '../helpers/auth-guard.js';

// ---------------------------------------------------------------------------

const emailBody = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email', description: 'User email address' },
  },
};

export default async function authRoutes(fastify) {
  // -------------------------------------------------------------------------
  // POST /user-signup
  // -------------------------------------------------------------------------
  fastify.post('/user-signup', {
    schema: {
      description: 'EMail Signup with email',
      tags: ['User'],
      body: emailBody,
      response: {
        200: successEnvelope(),
        400: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
      const { email } = request.body;

      // Generate a random 6-digit code (100000 – 999999)
      const code = Math.floor(100000 + Math.random() * 900000);

      // TODO: replace with email delivery — logging for development only
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
    },
  });

  // -------------------------------------------------------------------------
  // POST /verify-user
  // -------------------------------------------------------------------------
  fastify.post('/user-verify', {
    schema: {
      description:
        'Verify User with email and code. On success, returns a short-lived JWT for setting the password.',
      tags: ['User'],
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: {
            type: 'integer',
            minimum: 100000,
            maximum: 999999,
            description: '6-digit verification code',
          },
        },
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: { token: { type: 'string' } },
        }),
        400: errorEnvelope,
        404: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
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
    },
  });

  // -------------------------------------------------------------------------
  // POST /user-set-password
  // -------------------------------------------------------------------------
  fastify.post('/user-set-password', {
    schema: {
      description: `Set or reset a password.
- **New user** (\`newUser: true\` in token): creates the user record and returns a full session JWT.
- **Existing user** (\`newUser: false\` in token): updates the password and returns a confirmation message.`,
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: {
            type: 'string',
            minLength: 8,
            description: 'New password (min 8 characters)',
          },
        },
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: { token: { type: 'string' } },
        }),
        400: errorEnvelope,
        401: errorEnvelope,
        404: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
      // --- Token extraction & verification -----------------------------------
      const raw = extractBearer(request.headers.authorization);
      if (!raw) {
        return fail(
          reply,
          401,
          'Unauthorized',
          'Authorization header with Bearer token is required',
        );
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
          // --- Create new user -----------------------------------------------
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
          // --- Update existing user's password --------------------------------
          const { rowCount } = await client.query(
            'UPDATE users SET password = $1 WHERE email = $2',
            [hashed, email],
          );

          if (rowCount === 0) {
            return fail(reply, 404, 'Not found', 'No user found with this email');
          }

          return ok(reply, undefined, 'Password updated');
        }
      } finally {
        client.release();
      }
    },
  });

  // -------------------------------------------------------------------------
  // PATCH /user-update
  // -------------------------------------------------------------------------
  fastify.patch('/user-update', {
    schema: {
      description: "Update the authenticated user's name and/or email.",
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          name: { type: 'string', minLength: 1, description: 'Display name' },
          email: { type: 'string', format: 'email', description: 'New email address' },
        },
      },
      response: {
        200: successEnvelope(),
        400: errorEnvelope,
        401: errorEnvelope,
        409: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
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
    },
  });

  // -------------------------------------------------------------------------
  // PATCH /user-update-phone-number
  // -------------------------------------------------------------------------
  fastify.patch('/user-update-phone-number', {
    schema: {
      description:
        "Add or update the authenticated user's phone number. Generates a 4-digit verification code stored in phone_number_code.",
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['phone_number'],
        properties: {
          phone_number: {
            type: 'integer',
            description: 'Phone number digits only (no country code)',
          },
        },
      },
      response: {
        200: successEnvelope(),
        401: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
      const auth = await requireAuth(request, reply, false);
      if (!auth) return;

      const { phone_number } = request.body;

      // 4-digit OTP: 1000 – 9999
      const verificationCode = Math.floor(1000 + Math.random() * 9000);

      // TODO: replace with SMS delivery — logging for development only
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
    },
  });

  // -------------------------------------------------------------------------
  // POST /user-verify-phone-number
  // -------------------------------------------------------------------------
  fastify.post('/user-verify-phone-number', {
    schema: {
      description:
        "Verify the 4-digit code sent to the user's phone. Clears the code and marks the number as verified.",
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: {
            type: 'integer',
            minimum: 1000,
            maximum: 9999,
            description: '4-digit verification code',
          },
        },
      },
      response: {
        200: successEnvelope(),
        400: errorEnvelope,
        401: errorEnvelope,
        404: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
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
    },
  });

  // -------------------------------------------------------------------------
  // POST /login
  // -------------------------------------------------------------------------
  fastify.post('/login', {
    schema: {
      description:
        'Log in with email or phone number + password. Returns user info, studio access list, and a session JWT.',
      tags: ['User'],
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'User email address' },
          phone_number: { type: 'integer', description: 'Phone number (digits only)' },
          password: { type: 'string', minLength: 1, description: 'Account password' },
        },
        oneOf: [{ required: ['email'] }, { required: ['phone_number'] }],
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            access: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  studio_id: { type: 'integer' },
                  access: { type: 'array' },
                  type: { type: 'string' },
                },
              },
            },
            token: { type: 'string' },
          },
        }),
        400: errorEnvelope,
        401: errorEnvelope,
        404: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
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

        // --- Verify password ------------------------------------------------
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
          return fail(reply, 401, 'Unauthorized', 'Invalid password');
        }

        // --- Fetch studio access --------------------------------------------
        const { rows: accessRows } = await client.query(
          'SELECT studio_id, access, type FROM user_studios WHERE user_id = $1',
          [user.id],
        );

        // --- Update last_login ----------------------------------------------
        await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        // --- Build JWT (include first studioId if available) ----------------
        const tokenPayload = { userId: user.id, userEmail: user.email };
        if (accessRows.length > 0) {
          tokenPayload.studioId = accessRows.map((r) => r.studio_id);
        }

        const token = signToken(tokenPayload);

        return ok(
          reply,
          {
            name: user.name,
            email: user.email,
            access: accessRows.length > 0 ? accessRows[0].access : [],
            token,
          },
          'Login successful',
        );
      } finally {
        client.release();
      }
    },
  });

  // -------------------------------------------------------------------------
  // POST /user-add-new-user
  // -------------------------------------------------------------------------
  fastify.post('/user-add-new-user', {
    schema: {
      description:
        'Add a new user to the system and map them to the studio from the bearer token. ' +
        'If the email already exists the user is simply linked to the studio. ' +
        'New accounts are created without a password — the user must complete the normal sign-up flow to set one.',
      tags: ['User'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          name: { type: 'string', description: 'New user name' },
          email: { type: 'string', format: 'email', description: 'New user email' },
          phone_number: { type: 'integer', description: 'Phone number (optional)' },
        },
      },
      response: {
        200: successEnvelope({
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            is_new: {
              type: 'boolean',
              description: 'true = account was created, false = existing account linked',
            },
          },
        }),
        400: errorEnvelope,
        401: errorEnvelope,
        404: errorEnvelope,
        409: errorEnvelope,
        500: errorEnvelope,
      },
    },
    handler: async (request, reply) => {
      const auth = await requireAuth(request, reply);
      if (!auth) return;

      const { studioId } = auth;
      const { email, phone_number, name } = request.body;
      const normalizedEmail = email.toLowerCase();

      const client = await fastify.pg.connect();
      try {
        await client.query('BEGIN');

        // Verify the studio exists
        const { rows: studioRows } = await client.query('SELECT id FROM studios WHERE id = $1', [
          studioId,
        ]);
        if (studioRows.length === 0) {
          await client.query('ROLLBACK');
          return fail(reply, 404, 'Not found', 'Studio not found');
        }

        // Check if user already exists
        let { rows: existingRows } = await client.query('SELECT id FROM users WHERE email = $1', [
          normalizedEmail,
        ]);

        let userId;
        let isNew = false;

        if (existingRows.length > 0) {
          userId = existingRows[0].id;
        } else {
          const placeholderHash = await bcrypt.hash(Math.random().toString(36), SALT_ROUNDS);

          let q;
          const insertFields = ['email', 'password', 'last_login'];
          const insertValues = [normalizedEmail, placeholderHash, 'NOW()'];

          if (name) {
            insertFields.push('name');
            insertValues.push(name);
          }
          if (phone_number != null) {
            insertFields.push('phone_number');
            insertValues.push(phone_number);
          }

          const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
          q = await client.query(
            `INSERT INTO users (${insertFields.join(', ')}) VALUES (${placeholders}) RETURNING id`,
            insertValues,
          );

          userId = q.rows[0].id;
          isNew = true;
        }

        // Link user to studio (ignore if already linked)
        const { rowCount } = await client.query(
          `INSERT INTO user_studios (user_id, studio_id, type)
           VALUES ($1, $2, 'collaborator')
           ON CONFLICT (user_id, studio_id) DO NOTHING`,
          [userId, studioId],
        );

        if (!isNew && rowCount === 0) {
          await client.query('ROLLBACK');
          return fail(reply, 409, 'Conflict', 'This user is already linked to the studio');
        }

        await client.query('COMMIT');

        return ok(
          reply,
          { user_id: userId, is_new: isNew },
          isNew ? 'User created and linked to studio' : 'Existing user linked to studio',
        );
      } catch (err) {
        await client.query('ROLLBACK');
        fastify.log.error({ err }, 'user-add-new-user error');
        return fail(reply, 500, 'Internal server error', err.message);
      } finally {
        client.release();
      }
    },
  });
}
