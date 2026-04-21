import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { run, get } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const comparePasswords = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const createSession = async (userId, userType, token) => {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await run(
    'INSERT INTO sessions (id, user_id, user_type, token, expires_at) VALUES (?, ?, ?, ?, ?)',
    [sessionId, userId, userType, token, expiresAt.toISOString()]
  );

  return sessionId;
};

export const getSessionByToken = async (token) => {
  return get('SELECT * FROM sessions WHERE token = ? AND expires_at > CURRENT_TIMESTAMP', [token]);
};

export const invalidateSession = async (token) => {
  await run('DELETE FROM sessions WHERE token = ?', [token]);
};

export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const session = await getSessionByToken(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired' });
  }

  req.userId = verified.userId;
  req.token = token;
  next();
};

export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await get('SELECT * FROM users WHERE id = ?', [req.userId]);

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};
