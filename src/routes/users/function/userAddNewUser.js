import bcrypt from 'bcryptjs';
import { ok, fail } from '../../../helpers/respond.js';
import { requireAuth } from '../../../helpers/auth-guard.js';
import { SALT_ROUNDS } from '../../../helpers/schema.js';

export async function userAddNewUserHandler(request, reply) {
  const fastify = this;
  const auth = await requireAuth(request, reply);
  if (!auth) return;

  const { studioId } = auth;
  const { email, phone_number, name } = request.body;
  const normalizedEmail = email.toLowerCase();
  console.log('Adding user to studio', { studioId, email: normalizedEmail, phone_number, name });
  const client = await fastify.pg.connect();
  try {
    await client.query('BEGIN');

    const { rows: studioRows } = await client.query('SELECT id FROM studios WHERE id = $1', [
      studioId,
    ]);
    if (studioRows.length === 0) {
      await client.query('ROLLBACK');
      return fail(reply, 404, 'Not found', 'Studio not found');
    }

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
}
