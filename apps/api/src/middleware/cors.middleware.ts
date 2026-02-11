import type { Context, Next } from 'hono';

// Allowed origins from environment (comma-separated) or fallback to allow all in dev
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, '')) // strip trailing slashes
  .filter(Boolean);

export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header('Origin') || '';

  // In development or when no CORS_ORIGIN is set, allow all origins
  const isAllowed =
    allowedOrigins.length === 0 ||
    allowedOrigins.includes(origin) ||
    process.env.NODE_ENV === 'development';

  const responseOrigin = isAllowed ? origin || '*' : '';

  if (responseOrigin) {
    c.header('Access-Control-Allow-Origin', responseOrigin);
  }
  c.header('Access-Control-Allow-Credentials', 'true');
  c.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Expose-Headers', 'X-Conversation-Id, X-Agent-Type');

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
}
