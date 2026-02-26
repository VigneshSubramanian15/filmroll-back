import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const SECRET_PASSWORD_RESET = process.env.JWT_PASSWORD_RESET_SECRET;
if (!SECRET) throw new Error('JWT_SECRET env variable is required');
if (!SECRET_PASSWORD_RESET) throw new Error('JWT_PASSWORD_RESET_SECRET env variable is required');

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function signPasswordResetToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, SECRET_PASSWORD_RESET, { expiresIn });
}

export function verifyToken(token) {
    console.log('Verifying JWT token:', token);
  return jwt.verify(token, SECRET);
}

export function verifyPasswordResetToken(token) {
  return jwt.verify(token, SECRET_PASSWORD_RESET);
}

export function extractBearer(header) {
  if (!header) return null;
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return header.trim() || null;
}
