import type { Context, Next } from 'hono';
import { verifyAccessToken } from '../lib/jwt.js';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyAccessToken(token);

  if (!payload || typeof payload.userId !== 'string') {
    return c.json({ error: 'Invalid token' }, 401);
  }

  c.set('userId', payload.userId as string);
  if (typeof payload.email === 'string') {
    c.set('userEmail', payload.email as string);
  }

  await next();
}

